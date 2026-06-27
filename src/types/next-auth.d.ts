import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      rol: string;
      centroAcopioId?: string | null;
      centrNombre?: string | null;
      paisesAdmin?: string[];
    };
  }
}
