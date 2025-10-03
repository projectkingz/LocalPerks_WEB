import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/auth.config';
import { prisma } from '@/lib/prisma';
import { hash } from 'bcryptjs';

// Helper to check admin access
async function requireAdmin(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user || !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
    return null;
  }
  return session.user;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const admin = await requireAdmin(req);
  if (!admin) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const data = await req.json();
  
  // Get the user being updated
  const targetUser = await prisma.user.findUnique({
    where: { id: params.id }
  });

  if (!targetUser) {
    return NextResponse.json({ message: 'User not found' }, { status: 404 });
  }

  // Check permissions
  if (['ADMIN', 'SUPER_ADMIN'].includes(targetUser.role) && admin.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  // Prevent role changes by non-SUPER_ADMIN users
  if (data.role && admin.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ message: 'Only Super Admins can change roles' }, { status: 403 });
  }

  // Prevent password changes by non-SUPER_ADMIN users
  if (data.password && admin.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ message: 'Only Super Admins can change passwords' }, { status: 403 });
  }

  try {
    // Prepare update data
    const updateData: any = {
      name: data.name,
      email: data.email,
      tenantId: data.tenantId,
      points: data.points,
    };

    // Only include role if it's being changed and user is SUPER_ADMIN
    if (data.role && admin.role === 'SUPER_ADMIN') {
      updateData.role = data.role;
    }

    // Only include password if it's being changed and user is SUPER_ADMIN
    if (data.password && admin.role === 'SUPER_ADMIN') {
      updateData.password = await hash(data.password, 12);
    }

    const updatedUser = await prisma.user.update({
      where: { id: params.id },
      data: updateData,
    });

    // Return user info except password
    const { password, ...userInfo } = updatedUser;
    return NextResponse.json(userInfo);
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 400 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const admin = await requireAdmin(req);
  if (!admin) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  // Only SUPER_ADMIN can delete users
  if (admin.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ message: 'Only Super Admins can delete users' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const forceDelete = searchParams.get('force') === 'true';

  // Get the user being deleted
  const targetUser = await prisma.user.findUnique({
    where: { id: params.id },
    include: {
      transactions: true,
      activities: true,
      partnerTenants: true,
      tenant: true
    }
  });

  if (!targetUser) {
    return NextResponse.json({ message: 'User not found' }, { status: 404 });
  }

  // Prevent self-deletion
  if (targetUser.id === admin.id) {
    return NextResponse.json({ message: 'Cannot delete your own account' }, { status: 400 });
  }

  // Prevent deletion of other SUPER_ADMIN users
  if (targetUser.role === 'SUPER_ADMIN') {
    return NextResponse.json({ message: 'Cannot delete other Super Admin accounts' }, { status: 400 });
  }

  // Check for related data that would prevent deletion
  const relatedData = [];
  if (targetUser.transactions.length > 0) {
    relatedData.push(`${targetUser.transactions.length} transaction(s)`);
  }
  if (targetUser.activities.length > 0) {
    relatedData.push(`${targetUser.activities.length} activity record(s)`);
  }
  if (targetUser.partnerTenants.length > 0) {
    relatedData.push(`${targetUser.partnerTenants.length} tenant(s) as partner`);
  }
  if (targetUser.tenant) {
    relatedData.push('tenant association');
  }

  if (relatedData.length > 0 && !forceDelete) {
    return NextResponse.json({ 
      message: `Cannot delete user with related data: ${relatedData.join(', ')}. Please remove related data first or use force delete.`,
      hasRelatedData: true,
      relatedData: relatedData
    }, { status: 400 });
  }

  try {
    // If force delete is enabled, delete related data first
    if (forceDelete && relatedData.length > 0) {
      // Delete in transaction to ensure data consistency
      await prisma.$transaction(async (tx) => {
        // Delete transactions
        if (targetUser.transactions.length > 0) {
          await tx.transaction.deleteMany({
            where: { userId: params.id }
          });
        }

        // Delete activities
        if (targetUser.activities.length > 0) {
          await tx.activity.deleteMany({
            where: { userId: params.id }
          });
        }

        // Handle tenant associations
        if (targetUser.tenant) {
          await tx.user.update({
            where: { id: params.id },
            data: { tenantId: null }
          });
        }

        // Delete customer record if user has one
        const customer = await tx.customer.findUnique({
          where: { email: targetUser.email }
        });
        
        if (customer) {
          // Delete customer transactions first
          await tx.transaction.deleteMany({
            where: { customerId: customer.id }
          });
          
          // Then delete the customer (redemptions and vouchers will cascade)
          await tx.customer.delete({
            where: { id: customer.id }
          });
        }

        // Handle partner tenants (this is more complex - we might want to reassign or delete tenants)
        if (targetUser.partnerTenants.length > 0) {
          // First, delete all customers and their data associated with these tenants
          for (const tenant of targetUser.partnerTenants) {
            // Get all customers for this tenant
            const customers = await tx.customer.findMany({
              where: { tenantId: tenant.id }
            });
            
            // Delete customer transactions first
            for (const customer of customers) {
              await tx.transaction.deleteMany({
                where: { customerId: customer.id }
              });
            }
            
            // Delete customers (redemptions and vouchers will cascade)
            await tx.customer.deleteMany({
              where: { tenantId: tenant.id }
            });
            
            // Delete tenant transactions
            await tx.transaction.deleteMany({
              where: { tenantId: tenant.id }
            });
          }
          
          // Then delete the tenants
          await tx.tenant.deleteMany({
            where: { partnerUserId: params.id }
          });
        }

        // Finally delete the user
        await tx.user.delete({
          where: { id: params.id }
        });
      });

      return NextResponse.json({ 
        message: `User and all related data (${relatedData.join(', ')}) deleted successfully` 
      });
    } else {
      // Normal deletion (no related data)
      await prisma.user.delete({
        where: { id: params.id }
      });

      return NextResponse.json({ message: 'User deleted successfully' });
    }
  } catch (error: any) {
    console.error('Error deleting user:', error);
    
    // Handle specific Prisma errors
    if (error.code === 'P2003') {
      return NextResponse.json({ 
        message: 'Cannot delete user due to existing relationships. Please remove all related data first.' 
      }, { status: 400 });
    }
    
    return NextResponse.json({ message: error.message || 'Failed to delete user' }, { status: 400 });
  }
} 