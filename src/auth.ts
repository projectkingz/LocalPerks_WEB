import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/auth.config";

export const auth = () => getServerSession(authOptions); 