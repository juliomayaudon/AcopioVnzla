import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Contraseña", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.usuario.findUnique({
          where: { email: credentials.email },
          include: { centroAcopio: true },
        });

        if (!user || !user.activo) return null;
        // Los voluntarios no tienen contraseña: no pueden iniciar sesión
        if (!user.passwordHash) return null;

        const valid = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!valid) return null;

        return {
          id: user.id,
          name: user.nombre,
          email: user.email,
          rol: user.rol,
          centroAcopioId: user.centroAcopioId,
          centrNombre: user.centroAcopio?.nombre,
          paisesAdmin: user.paisesAdmin,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.rol = (user as any).rol;
        token.centroAcopioId = (user as any).centroAcopioId;
        token.centrNombre = (user as any).centrNombre;
        token.paisesAdmin = (user as any).paisesAdmin;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.rol = token.rol as string;
        session.user.centroAcopioId = token.centroAcopioId as string;
        session.user.centrNombre = token.centrNombre as string;
        session.user.paisesAdmin = (token.paisesAdmin as string[]) || [];
      }
      return session;
    },
  },
};
