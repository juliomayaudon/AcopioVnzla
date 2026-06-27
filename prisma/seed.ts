import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Iniciando seed...");

  // ── Categorías ──────────────────────────────────────────────────────
  const cats = [
    { nombre: "Alimentos no perecederos", descripcion: "Granos, harinas, enlatados, aceites" },
    { nombre: "Agua e hidratación",       descripcion: "Agua, bebidas isotónicas, jugos, suero oral" },
    { nombre: "Medicamentos",             descripcion: "Medicinas, vitaminas, suplementos" },
    { nombre: "Insumos médicos",          descripcion: "Gasas, vendas, guantes, material sanitario" },
    { nombre: "Higiene personal",         descripcion: "Jabón, shampoo, papel higiénico, pañales adulto" },
    { nombre: "Ropa y calzado",           descripcion: "Ropa para adultos y niños, calzado" },
    { nombre: "Artículos para bebés",     descripcion: "Pañales, fórmula láctea, teteros, ropa de bebé" },
    { nombre: "Artículos del hogar",      descripcion: "Cobijas, colchonetas, utensilios de cocina" },
    { nombre: "Herramientas y equipos",   descripcion: "Linternas, pilas, palas, lonas plásticas" },
    { nombre: "Limpieza y desinfección",  descripcion: "Cloro, desinfectante, detergente, bolsas" },
    { nombre: "Alimento para mascotas",   descripcion: "Comida para perros, gatos y otras mascotas" },
    { nombre: "Artículos para mascotas",  descripcion: "Correas, camas, comederos, arena, medicinas veterinarias" },
  ];

  const catMap: Record<string, string> = {};
  for (const cat of cats) {
    const c = await prisma.categoria.upsert({
      where: { nombre: cat.nombre },
      update: { descripcion: cat.descripcion },
      create: { nombre: cat.nombre, descripcion: cat.descripcion, icono: "" },
    });
    catMap[cat.nombre] = c.id;
    console.log(`  ✓ ${cat.nombre}`);
  }

  // ── Eliminar categorías obsoletas (de seeds anteriores) sin productos ──
  const nombresValidos = cats.map((c) => c.nombre);
  const todasCats = await prisma.categoria.findMany({ include: { _count: { select: { productos: true } } } });
  for (const c of todasCats) {
    if (!nombresValidos.includes(c.nombre) && c._count.productos === 0) {
      await prisma.categoria.delete({ where: { id: c.id } });
      console.log(`  ✗ categoría obsoleta: ${c.nombre}`);
    }
  }

  // ── Limpiar productos obsoletos (variantes de tamaño fijo) ──────────
  const obsoletos = [
    "Agua embotellada 500ml", "Agua embotellada 1.5L", "Agua embotellada 5L",
    "Aceite vegetal 1L", "Atún en lata 170g", "Sardinas en lata 125g",
    "Alcohol antiséptico 500ml", "Shampoo 400ml", "Cloro / lejía 1L", "Desinfectante 1L",
  ];
  for (const nombre of obsoletos) {
    const p = await prisma.producto.findFirst({ where: { nombre } });
    if (p) {
      const donaciones = await prisma.itemDonacion.count({ where: { productoId: p.id } });
      if (donaciones === 0) {
        await prisma.producto.delete({ where: { id: p.id } });
        console.log(`  ✗ ${nombre} (eliminado)`);
      }
    }
  }

  // ── Productos ────────────────────────────────────────────────────────
  const productos = [
    // ── Alimentos no perecederos ─────────────────────────────────────
    { nombre: "Arroz",                        cat: "Alimentos no perecederos", unidad: "KG"       as const },
    { nombre: "Caraotas negras",              cat: "Alimentos no perecederos", unidad: "KG"       as const },
    { nombre: "Lentejas",                     cat: "Alimentos no perecederos", unidad: "KG"       as const },
    { nombre: "Harina de maíz",               cat: "Alimentos no perecederos", unidad: "KG"       as const },
    { nombre: "Pasta / fideos",               cat: "Alimentos no perecederos", unidad: "KG"       as const },
    { nombre: "Avena",                        cat: "Alimentos no perecederos", unidad: "KG"       as const },
    { nombre: "Azúcar",                       cat: "Alimentos no perecederos", unidad: "KG"       as const },
    { nombre: "Sal",                          cat: "Alimentos no perecederos", unidad: "KG"       as const },
    { nombre: "Café soluble / instantáneo",   cat: "Alimentos no perecederos", unidad: "KG"       as const },
    { nombre: "Leche en polvo",               cat: "Alimentos no perecederos", unidad: "KG"       as const },
    { nombre: "Leche evaporada (lata)",       cat: "Alimentos no perecederos", unidad: "LITROS"   as const },
    { nombre: "Aceite vegetal",               cat: "Alimentos no perecederos", unidad: "LITROS"   as const },
    { nombre: "Margarina / mantequilla",      cat: "Alimentos no perecederos", unidad: "KG"       as const },
    { nombre: "Galletas / crackers",          cat: "Alimentos no perecederos", unidad: "KG"       as const },
    { nombre: "Maní / frutos secos",          cat: "Alimentos no perecederos", unidad: "KG"       as const },
    { nombre: "Atún en lata",                 cat: "Alimentos no perecederos", unidad: "KG"       as const },
    { nombre: "Sardinas en lata",             cat: "Alimentos no perecederos", unidad: "KG"       as const },
    { nombre: "Salsa de tomate",              cat: "Alimentos no perecederos", unidad: "KG"       as const },
    { nombre: "Sopas instantáneas",           cat: "Alimentos no perecederos", unidad: "KG"       as const },
    { nombre: "Gelatina / postre instantáneo", cat: "Alimentos no perecederos", unidad: "KG"      as const },
    { nombre: "Harina de trigo",              cat: "Alimentos no perecederos", unidad: "KG"       as const },
    { nombre: "Quinua",                       cat: "Alimentos no perecederos", unidad: "KG"       as const },
    { nombre: "Frijoles",                     cat: "Alimentos no perecederos", unidad: "KG"       as const },
    { nombre: "Gomitas",                      cat: "Alimentos no perecederos", unidad: "KG"       as const },

    // ── Agua e hidratación ───────────────────────────────────────────
    { nombre: "Agua embotellada",             cat: "Agua e hidratación", unidad: "LITROS"   as const },
    { nombre: "Bebidas isotónicas",           cat: "Agua e hidratación", unidad: "LITROS"   as const },
    { nombre: "Jugo / néctar en caja",        cat: "Agua e hidratación", unidad: "LITROS"   as const },
    { nombre: "Agua de coco",                 cat: "Agua e hidratación", unidad: "LITROS"   as const },
    { nombre: "Suero oral",                   cat: "Agua e hidratación", unidad: "LITROS"   as const },
    { nombre: "Sales de rehidratación",       cat: "Agua e hidratación", unidad: "KG"       as const },

    // ── Medicamentos ─────────────────────────────────────────────────
    { nombre: "Acetaminofén 500mg",           cat: "Medicamentos", unidad: "UNIDADES" as const },
    { nombre: "Ibuprofeno 400mg",             cat: "Medicamentos", unidad: "UNIDADES" as const },
    { nombre: "Amoxicilina 500mg",            cat: "Medicamentos", unidad: "UNIDADES" as const },
    { nombre: "Antigripal",                   cat: "Medicamentos", unidad: "UNIDADES" as const },
    { nombre: "Antidiarreico",                cat: "Medicamentos", unidad: "UNIDADES" as const },
    { nombre: "Antiácido",                    cat: "Medicamentos", unidad: "UNIDADES" as const },
    { nombre: "Antiparasitarios",             cat: "Medicamentos", unidad: "UNIDADES" as const },
    { nombre: "Antihistamínicos",             cat: "Medicamentos", unidad: "UNIDADES" as const },
    { nombre: "Vitaminas / multivitamínicos", cat: "Medicamentos", unidad: "UNIDADES" as const },

    // ── Insumos médicos ──────────────────────────────────────────────
    { nombre: "Gasas estériles",              cat: "Insumos médicos", unidad: "UNIDADES" as const },
    { nombre: "Vendas elásticas",             cat: "Insumos médicos", unidad: "UNIDADES" as const },
    { nombre: "Guantes de látex (par)",       cat: "Insumos médicos", unidad: "UNIDADES" as const },
    { nombre: "Tapabocas / mascarillas",      cat: "Insumos médicos", unidad: "UNIDADES" as const },
    { nombre: "Alcohol antiséptico",          cat: "Insumos médicos", unidad: "LITROS"   as const },
    { nombre: "Solución salina",              cat: "Insumos médicos", unidad: "LITROS"   as const },
    { nombre: "Jeringas desechables",         cat: "Insumos médicos", unidad: "UNIDADES" as const },
    { nombre: "Termómetros",                  cat: "Insumos médicos", unidad: "UNIDADES" as const },

    // ── Higiene personal ─────────────────────────────────────────────
    { nombre: "Jabón de baño",                cat: "Higiene personal", unidad: "UNIDADES" as const },
    { nombre: "Shampoo",                      cat: "Higiene personal", unidad: "LITROS"   as const },
    { nombre: "Pasta dental",                 cat: "Higiene personal", unidad: "UNIDADES" as const },
    { nombre: "Cepillo de dientes",           cat: "Higiene personal", unidad: "UNIDADES" as const },
    { nombre: "Papel higiénico (rollo)",      cat: "Higiene personal", unidad: "UNIDADES" as const },
    { nombre: "Toallitas húmedas",            cat: "Higiene personal", unidad: "UNIDADES" as const },
    { nombre: "Toallas sanitarias",           cat: "Higiene personal", unidad: "UNIDADES" as const },
    { nombre: "Pañales adulto",               cat: "Higiene personal", unidad: "UNIDADES" as const },
    { nombre: "Desodorante",                  cat: "Higiene personal", unidad: "UNIDADES" as const },
    { nombre: "Máquinas de afeitar",          cat: "Higiene personal", unidad: "UNIDADES" as const },
    { nombre: "Enjuague bucal",               cat: "Higiene personal", unidad: "UNIDADES" as const },

    // ── Ropa y calzado ───────────────────────────────────────────────
    { nombre: "Ropa adulto",                  cat: "Ropa y calzado", unidad: "KG" as const },
    { nombre: "Ropa niño/a",                 cat: "Ropa y calzado", unidad: "KG" as const },
    { nombre: "Ropa interior",               cat: "Ropa y calzado", unidad: "KG" as const },
    { nombre: "Calzado adulto",               cat: "Ropa y calzado", unidad: "KG" as const },
    { nombre: "Calzado niño/a",              cat: "Ropa y calzado", unidad: "KG" as const },
    { nombre: "Abrigos / chaquetas",          cat: "Ropa y calzado", unidad: "KG" as const },

    // ── Artículos para bebés ─────────────────────────────────────────
    { nombre: "Pañales bebé talla P",         cat: "Artículos para bebés", unidad: "UNIDADES" as const },
    { nombre: "Pañales bebé talla M",         cat: "Artículos para bebés", unidad: "UNIDADES" as const },
    { nombre: "Pañales bebé talla G",         cat: "Artículos para bebés", unidad: "UNIDADES" as const },
    { nombre: "Fórmula láctea",               cat: "Artículos para bebés", unidad: "KG"       as const },
    { nombre: "Teteros / biberones",          cat: "Artículos para bebés", unidad: "UNIDADES" as const },
    { nombre: "Ropa de bebé",                 cat: "Artículos para bebés", unidad: "KG"       as const },

    // ── Artículos del hogar ──────────────────────────────────────────
    { nombre: "Cobijas / frazadas",           cat: "Artículos del hogar", unidad: "UNIDADES" as const },
    { nombre: "Sábanas",                      cat: "Artículos del hogar", unidad: "UNIDADES" as const },
    { nombre: "Colchonetas",                  cat: "Artículos del hogar", unidad: "UNIDADES" as const },
    { nombre: "Ollas",                        cat: "Artículos del hogar", unidad: "UNIDADES" as const },
    { nombre: "Platos y vasos",               cat: "Artículos del hogar", unidad: "UNIDADES" as const },
    { nombre: "Cubiertos",                    cat: "Artículos del hogar", unidad: "UNIDADES" as const },
    { nombre: "Velas / candelas",             cat: "Artículos del hogar", unidad: "UNIDADES" as const },
    { nombre: "Fósforos / encendedores",      cat: "Artículos del hogar", unidad: "UNIDADES" as const },
    { nombre: "Protector de cama",            cat: "Artículos del hogar", unidad: "UNIDADES" as const },

    // ── Herramientas y equipos ───────────────────────────────────────
    { nombre: "Linternas",                    cat: "Herramientas y equipos", unidad: "UNIDADES" as const },
    { nombre: "Pilas AA",                     cat: "Herramientas y equipos", unidad: "UNIDADES" as const },
    { nombre: "Pilas D (grandes)",            cat: "Herramientas y equipos", unidad: "UNIDADES" as const },
    { nombre: "Palas",                        cat: "Herramientas y equipos", unidad: "UNIDADES" as const },
    { nombre: "Picos",                        cat: "Herramientas y equipos", unidad: "UNIDADES" as const },
    { nombre: "Lonas plásticas",              cat: "Herramientas y equipos", unidad: "UNIDADES" as const },
    { nombre: "Cuerda / soga",                cat: "Herramientas y equipos", unidad: "UNIDADES" as const },

    // ── Limpieza y desinfección ──────────────────────────────────────
    { nombre: "Cloro / lejía",                cat: "Limpieza y desinfección", unidad: "LITROS"   as const },
    { nombre: "Desinfectante",                cat: "Limpieza y desinfección", unidad: "LITROS"   as const },
    { nombre: "Detergente en polvo",          cat: "Limpieza y desinfección", unidad: "KG"       as const },
    { nombre: "Escoba y recogedor",           cat: "Limpieza y desinfección", unidad: "UNIDADES" as const },
    { nombre: "Bolsas de basura (paq.)",      cat: "Limpieza y desinfección", unidad: "UNIDADES" as const },

    // ── Alimento para mascotas ───────────────────────────────────────
    { nombre: "Alimento para perros",         cat: "Alimento para mascotas", unidad: "KG"       as const },
    { nombre: "Alimento para gatos",          cat: "Alimento para mascotas", unidad: "KG"       as const },
    { nombre: "Comida húmeda para mascota (lata)", cat: "Alimento para mascotas", unidad: "UNIDADES" as const },

    // ── Artículos para mascotas ──────────────────────────────────────
    { nombre: "Arena para gatos",             cat: "Artículos para mascotas", unidad: "KG"       as const },
    { nombre: "Correas y collares",           cat: "Artículos para mascotas", unidad: "UNIDADES" as const },
    { nombre: "Comederos / bebederos",        cat: "Artículos para mascotas", unidad: "UNIDADES" as const },
    { nombre: "Camas / mantas para mascota",  cat: "Artículos para mascotas", unidad: "UNIDADES" as const },
    { nombre: "Medicinas veterinarias",       cat: "Artículos para mascotas", unidad: "UNIDADES" as const },
  ];

  for (const p of productos) {
    const existe = await prisma.producto.findFirst({ where: { nombre: p.nombre } });
    if (!existe) {
      await prisma.producto.create({
        data: {
          nombre: p.nombre,
          unidad: p.unidad,
          valorUnitario: null,
          etiquetaUnidad: null,
          categoriaId: catMap[p.cat],
        },
      });
    } else {
      await prisma.producto.update({
        where: { id: existe.id },
        data: { unidad: p.unidad, valorUnitario: null, etiquetaUnidad: null, categoriaId: catMap[p.cat] },
      });
    }
  }
  console.log(`✓ ${productos.length} productos`);

  // ── Super Administrador ───────────────────────────────────────────────
  // En producción define SEED_SUPERADMIN_EMAIL y SEED_SUPERADMIN_PASSWORD.
  const SUPERADMIN_EMAIL = process.env.SEED_SUPERADMIN_EMAIL || "superadmin@acopiovzla.com";
  const SUPERADMIN_PASS = process.env.SEED_SUPERADMIN_PASSWORD || "SuperAdmin2024!";
  if (!process.env.SEED_SUPERADMIN_PASSWORD) {
    console.warn("⚠ Usando contraseña de superadmin POR DEFECTO (solo para desarrollo).");
    console.warn("  En producción define SEED_SUPERADMIN_PASSWORD con una clave fuerte.");
  }

  const existeSuper = await prisma.usuario.findUnique({ where: { email: SUPERADMIN_EMAIL } });
  if (existeSuper) {
    await prisma.usuario.update({ where: { email: SUPERADMIN_EMAIL }, data: { rol: "SUPERADMIN", activo: true } });
  } else {
    await prisma.usuario.create({
      data: {
        nombre: "Super Administrador",
        email: SUPERADMIN_EMAIL,
        passwordHash: await bcrypt.hash(SUPERADMIN_PASS, 12),
        rol: "SUPERADMIN",
      },
    });
  }
  console.log(`✓ Superadmin: ${SUPERADMIN_EMAIL}`);

  // ── Datos de demostración (centro + admin de prueba) ──────────────────
  // Solo se crean si SEED_DEMO=true (NO usar en producción).
  if (process.env.SEED_DEMO === "true") {
    const centroCuenca = await prisma.centroAcopio.upsert({
      where: { id: "centro-cuenca-ecuador" },
      update: { latitud: -2.9001, longitud: -79.0059, responsable: "Admin Cuenca" },
      create: {
        id: "centro-cuenca-ecuador",
        nombre: "Centro Cuenca", ciudad: "Cuenca", pais: "Ecuador",
        direccion: "Por definir", responsable: "Admin Cuenca",
        latitud: -2.9001, longitud: -79.0059, activo: true,
      },
    });
    await prisma.usuario.upsert({
      where: { email: "admin@acopiovzla.com" },
      update: { rol: "ADMIN", centroAcopioId: centroCuenca.id },
      create: {
        nombre: "Admin Cuenca", email: "admin@acopiovzla.com",
        passwordHash: await bcrypt.hash("Admin2024!", 12),
        rol: "ADMIN", centroAcopioId: centroCuenca.id,
      },
    });
    console.log("✓ Datos de demostración creados (Centro Cuenca + admin)");
  }

  console.log("\n✅ Seed completado!");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
