import NextAuth from "next-auth";
import { authOptions } from "@/app/api/auth/auth.config";

const auth = NextAuth(authOptions);

export { auth as GET, auth as POST };
