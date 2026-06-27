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
    { nombre: "Garbanzos",                    cat: "Alimentos no perecederos", unidad: "KG"       as const },
    { nombre: "Arvejas / guisantes secos",    cat: "Alimentos no perecederos", unidad: "KG"       as const },
    { nombre: "Maíz en grano",                cat: "Alimentos no perecederos", unidad: "KG"       as const },
    { nombre: "Caraotas blancas",             cat: "Alimentos no perecederos", unidad: "KG"       as const },
    { nombre: "Caraotas rojas",               cat: "Alimentos no perecederos", unidad: "KG"       as const },
    { nombre: "Mermelada",                    cat: "Alimentos no perecederos", unidad: "KG"       as const },
    { nombre: "Miel",                         cat: "Alimentos no perecederos", unidad: "LITROS"   as const },
    { nombre: "Vinagre",                      cat: "Alimentos no perecederos", unidad: "LITROS"   as const },
    { nombre: "Mayonesa",                     cat: "Alimentos no perecederos", unidad: "KG"       as const },
    { nombre: "Salsa de soya",                cat: "Alimentos no perecederos", unidad: "LITROS"   as const },
    { nombre: "Cubitos de caldo",             cat: "Alimentos no perecederos", unidad: "UNIDADES" as const },
    { nombre: "Chocolate en polvo / cacao",   cat: "Alimentos no perecederos", unidad: "KG"       as const },
    { nombre: "Chocolate en barra",           cat: "Alimentos no perecederos", unidad: "KG"       as const },
    { nombre: "Pollo enlatado",               cat: "Alimentos no perecederos", unidad: "KG"       as const },
    { nombre: "Carne enlatada (corned beef)", cat: "Alimentos no perecederos", unidad: "KG"       as const },
    { nombre: "Vegetales en lata",            cat: "Alimentos no perecederos", unidad: "KG"       as const },
    { nombre: "Frutas en almíbar",            cat: "Alimentos no perecederos", unidad: "KG"       as const },
    { nombre: "Compota / puré de fruta",      cat: "Alimentos no perecederos", unidad: "UNIDADES" as const },
    { nombre: "Cereal de desayuno",           cat: "Alimentos no perecederos", unidad: "KG"       as const },
    { nombre: "Fideos instantáneos / ramen",  cat: "Alimentos no perecederos", unidad: "UNIDADES" as const },
    { nombre: "Barras de cereal",             cat: "Alimentos no perecederos", unidad: "UNIDADES" as const },
    { nombre: "Pan tostado",                  cat: "Alimentos no perecederos", unidad: "KG"       as const },
    { nombre: "Caramelos / dulces",           cat: "Alimentos no perecederos", unidad: "KG"       as const },
    { nombre: "Especias y condimentos",       cat: "Alimentos no perecederos", unidad: "KG"       as const },
    { nombre: "Mezclas para tortas / panqueques", cat: "Alimentos no perecederos", unidad: "KG"   as const },
    { nombre: "Polenta",                      cat: "Alimentos no perecederos", unidad: "KG"       as const },
    { nombre: "Encurtidos en frasco",         cat: "Alimentos no perecederos", unidad: "KG"       as const },

    // ── Agua e hidratación ───────────────────────────────────────────
    { nombre: "Agua embotellada",             cat: "Agua e hidratación", unidad: "LITROS"   as const },
    { nombre: "Bebidas isotónicas",           cat: "Agua e hidratación", unidad: "LITROS"   as const },
    { nombre: "Jugo / néctar en caja",        cat: "Agua e hidratación", unidad: "LITROS"   as const },
    { nombre: "Agua de coco",                 cat: "Agua e hidratación", unidad: "LITROS"   as const },
    { nombre: "Suero oral",                   cat: "Agua e hidratación", unidad: "LITROS"   as const },
    { nombre: "Sales de rehidratación",       cat: "Agua e hidratación", unidad: "KG"       as const },
    { nombre: "Té / infusiones (bolsas)",     cat: "Agua e hidratación", unidad: "UNIDADES" as const },
    { nombre: "Polvo para preparar refresco", cat: "Agua e hidratación", unidad: "KG"       as const },
    { nombre: "Bebidas energéticas",          cat: "Agua e hidratación", unidad: "LITROS"   as const },
    { nombre: "Leche vegetal (almendra/soya/avena)", cat: "Agua e hidratación", unidad: "LITROS" as const },

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
    { nombre: "Aspirina",                     cat: "Medicamentos", unidad: "UNIDADES" as const },
    { nombre: "Diclofenaco",                  cat: "Medicamentos", unidad: "UNIDADES" as const },
    { nombre: "Loratadina",                   cat: "Medicamentos", unidad: "UNIDADES" as const },
    { nombre: "Omeprazol",                    cat: "Medicamentos", unidad: "UNIDADES" as const },
    { nombre: "Sales de hierro / hematínicos",cat: "Medicamentos", unidad: "UNIDADES" as const },
    { nombre: "Vitamina C",                   cat: "Medicamentos", unidad: "UNIDADES" as const },
    { nombre: "Complejo B",                   cat: "Medicamentos", unidad: "UNIDADES" as const },
    { nombre: "Vitamina D",                   cat: "Medicamentos", unidad: "UNIDADES" as const },
    { nombre: "Jarabe para la tos",           cat: "Medicamentos", unidad: "UNIDADES" as const },
    { nombre: "Crema antibiótica / bacitracina", cat: "Medicamentos", unidad: "UNIDADES" as const },
    { nombre: "Crema antimicótica",           cat: "Medicamentos", unidad: "UNIDADES" as const },
    { nombre: "Hidrocortisona crema",         cat: "Medicamentos", unidad: "UNIDADES" as const },
    { nombre: "Gotas oftálmicas",             cat: "Medicamentos", unidad: "UNIDADES" as const },
    { nombre: "Spray nasal salino",           cat: "Medicamentos", unidad: "UNIDADES" as const },
    { nombre: "Pomada antiinflamatoria",      cat: "Medicamentos", unidad: "UNIDADES" as const },
    { nombre: "Salbutamol / broncodilatador", cat: "Medicamentos", unidad: "UNIDADES" as const },
    { nombre: "Anticonceptivos",              cat: "Medicamentos", unidad: "UNIDADES" as const },
    { nombre: "Medicina para hipertensión",   cat: "Medicamentos", unidad: "UNIDADES" as const },
    { nombre: "Insulina",                     cat: "Medicamentos", unidad: "UNIDADES" as const },
    { nombre: "Suplementos de calcio",        cat: "Medicamentos", unidad: "UNIDADES" as const },
    { nombre: "Probióticos",                  cat: "Medicamentos", unidad: "UNIDADES" as const },

    // ── Insumos médicos ──────────────────────────────────────────────
    { nombre: "Gasas estériles",              cat: "Insumos médicos", unidad: "UNIDADES" as const },
    { nombre: "Vendas elásticas",             cat: "Insumos médicos", unidad: "UNIDADES" as const },
    { nombre: "Guantes de látex (par)",       cat: "Insumos médicos", unidad: "UNIDADES" as const },
    { nombre: "Tapabocas / mascarillas",      cat: "Insumos médicos", unidad: "UNIDADES" as const },
    { nombre: "Alcohol antiséptico",          cat: "Insumos médicos", unidad: "LITROS"   as const },
    { nombre: "Solución salina",              cat: "Insumos médicos", unidad: "LITROS"   as const },
    { nombre: "Jeringas desechables",         cat: "Insumos médicos", unidad: "UNIDADES" as const },
    { nombre: "Termómetros",                  cat: "Insumos médicos", unidad: "UNIDADES" as const },
    { nombre: "Curitas / banditas adhesivas", cat: "Insumos médicos", unidad: "UNIDADES" as const },
    { nombre: "Algodón",                      cat: "Insumos médicos", unidad: "KG"       as const },
    { nombre: "Esparadrapo / cinta médica",   cat: "Insumos médicos", unidad: "UNIDADES" as const },
    { nombre: "Tensiómetro",                  cat: "Insumos médicos", unidad: "UNIDADES" as const },
    { nombre: "Oxímetro de pulso",            cat: "Insumos médicos", unidad: "UNIDADES" as const },
    { nombre: "Glucómetro",                   cat: "Insumos médicos", unidad: "UNIDADES" as const },
    { nombre: "Tiras reactivas glucosa",      cat: "Insumos médicos", unidad: "UNIDADES" as const },
    { nombre: "Hisopos / cotonetes",          cat: "Insumos médicos", unidad: "UNIDADES" as const },
    { nombre: "Apósitos / parches",           cat: "Insumos médicos", unidad: "UNIDADES" as const },
    { nombre: "Yodo / povidona",              cat: "Insumos médicos", unidad: "LITROS"   as const },
    { nombre: "Agua oxigenada",               cat: "Insumos médicos", unidad: "LITROS"   as const },
    { nombre: "Botiquín de primeros auxilios",cat: "Insumos médicos", unidad: "UNIDADES" as const },
    { nombre: "Sueros intravenosos",          cat: "Insumos médicos", unidad: "LITROS"   as const },
    { nombre: "Mascarilla N95",               cat: "Insumos médicos", unidad: "UNIDADES" as const },
    { nombre: "Sillas de ruedas",             cat: "Insumos médicos", unidad: "UNIDADES" as const },
    { nombre: "Muletas",                      cat: "Insumos médicos", unidad: "UNIDADES" as const },
    { nombre: "Bastones",                     cat: "Insumos médicos", unidad: "UNIDADES" as const },
    { nombre: "Collares cervicales",          cat: "Insumos médicos", unidad: "UNIDADES" as const },
    { nombre: "Inmovilizadores / férulas",    cat: "Insumos médicos", unidad: "UNIDADES" as const },
    { nombre: "Bolsas frío/calor instantáneo",cat: "Insumos médicos", unidad: "UNIDADES" as const },

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
    { nombre: "Acondicionador",               cat: "Higiene personal", unidad: "LITROS"   as const },
    { nombre: "Hilo dental",                  cat: "Higiene personal", unidad: "UNIDADES" as const },
    { nombre: "Crema de afeitar / espuma",    cat: "Higiene personal", unidad: "UNIDADES" as const },
    { nombre: "Crema corporal / hidratante",  cat: "Higiene personal", unidad: "UNIDADES" as const },
    { nombre: "Talco corporal",               cat: "Higiene personal", unidad: "KG"       as const },
    { nombre: "Protector solar",              cat: "Higiene personal", unidad: "UNIDADES" as const },
    { nombre: "Repelente de insectos",        cat: "Higiene personal", unidad: "UNIDADES" as const },
    { nombre: "Cortauñas",                    cat: "Higiene personal", unidad: "UNIDADES" as const },
    { nombre: "Peines / cepillos para cabello", cat: "Higiene personal", unidad: "UNIDADES" as const },
    { nombre: "Toallas de baño",              cat: "Higiene personal", unidad: "UNIDADES" as const },
    { nombre: "Tampones",                     cat: "Higiene personal", unidad: "UNIDADES" as const },
    { nombre: "Copa menstrual",               cat: "Higiene personal", unidad: "UNIDADES" as const },
    { nombre: "Pañuelos desechables",         cat: "Higiene personal", unidad: "UNIDADES" as const },
    { nombre: "Esponjas / fibras de baño",    cat: "Higiene personal", unidad: "UNIDADES" as const },

    // ── Ropa y calzado ───────────────────────────────────────────────
    { nombre: "Ropa adulto",                  cat: "Ropa y calzado", unidad: "KG" as const },
    { nombre: "Ropa niño/a",                 cat: "Ropa y calzado", unidad: "KG" as const },
    { nombre: "Ropa interior",               cat: "Ropa y calzado", unidad: "KG" as const },
    { nombre: "Calzado adulto",               cat: "Ropa y calzado", unidad: "KG" as const },
    { nombre: "Calzado niño/a",              cat: "Ropa y calzado", unidad: "KG" as const },
    { nombre: "Abrigos / chaquetas",          cat: "Ropa y calzado", unidad: "KG" as const },
    { nombre: "Medias / calcetines",          cat: "Ropa y calzado", unidad: "UNIDADES" as const },
    { nombre: "Pijamas",                      cat: "Ropa y calzado", unidad: "KG" as const },
    { nombre: "Gorras / sombreros",           cat: "Ropa y calzado", unidad: "UNIDADES" as const },
    { nombre: "Bufandas / pañoletas",         cat: "Ropa y calzado", unidad: "UNIDADES" as const },
    { nombre: "Guantes textiles",             cat: "Ropa y calzado", unidad: "UNIDADES" as const },
    { nombre: "Botas de goma",                cat: "Ropa y calzado", unidad: "UNIDADES" as const },
    { nombre: "Sandalias / chancletas",       cat: "Ropa y calzado", unidad: "UNIDADES" as const },
    { nombre: "Trajes de baño",               cat: "Ropa y calzado", unidad: "UNIDADES" as const },

    // ── Artículos para bebés ─────────────────────────────────────────
    { nombre: "Pañales bebé talla P",         cat: "Artículos para bebés", unidad: "UNIDADES" as const },
    { nombre: "Pañales bebé talla M",         cat: "Artículos para bebés", unidad: "UNIDADES" as const },
    { nombre: "Pañales bebé talla G",         cat: "Artículos para bebés", unidad: "UNIDADES" as const },
    { nombre: "Fórmula láctea",               cat: "Artículos para bebés", unidad: "KG"       as const },
    { nombre: "Teteros / biberones",          cat: "Artículos para bebés", unidad: "UNIDADES" as const },
    { nombre: "Ropa de bebé",                 cat: "Artículos para bebés", unidad: "KG"       as const },
    { nombre: "Pañales bebé talla XG",        cat: "Artículos para bebés", unidad: "UNIDADES" as const },
    { nombre: "Pañales recién nacido",        cat: "Artículos para bebés", unidad: "UNIDADES" as const },
    { nombre: "Chupetes / chupones",          cat: "Artículos para bebés", unidad: "UNIDADES" as const },
    { nombre: "Aceite para bebé",             cat: "Artículos para bebés", unidad: "LITROS"   as const },
    { nombre: "Crema antipañalitis",          cat: "Artículos para bebés", unidad: "UNIDADES" as const },
    { nombre: "Shampoo de bebé",              cat: "Artículos para bebés", unidad: "LITROS"   as const },
    { nombre: "Jabón de bebé",                cat: "Artículos para bebés", unidad: "UNIDADES" as const },
    { nombre: "Compota / colado infantil",    cat: "Artículos para bebés", unidad: "UNIDADES" as const },
    { nombre: "Cereal infantil",              cat: "Artículos para bebés", unidad: "KG"       as const },
    { nombre: "Cobijas de bebé",              cat: "Artículos para bebés", unidad: "UNIDADES" as const },
    { nombre: "Pañitos húmedos bebé",         cat: "Artículos para bebés", unidad: "UNIDADES" as const },
    { nombre: "Babero",                       cat: "Artículos para bebés", unidad: "UNIDADES" as const },
    { nombre: "Mordedores",                   cat: "Artículos para bebés", unidad: "UNIDADES" as const },
    { nombre: "Coche / cochecito",            cat: "Artículos para bebés", unidad: "UNIDADES" as const },
    { nombre: "Sonajeros / juguetes bebé",    cat: "Artículos para bebés", unidad: "UNIDADES" as const },

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
    { nombre: "Almohadas",                    cat: "Artículos del hogar", unidad: "UNIDADES" as const },
    { nombre: "Toallas de manos",             cat: "Artículos del hogar", unidad: "UNIDADES" as const },
    { nombre: "Cocina portátil / cocinilla",  cat: "Artículos del hogar", unidad: "UNIDADES" as const },
    { nombre: "Bombona / cilindro de gas",    cat: "Artículos del hogar", unidad: "UNIDADES" as const },
    { nombre: "Sartenes",                     cat: "Artículos del hogar", unidad: "UNIDADES" as const },
    { nombre: "Cuchillos de cocina",          cat: "Artículos del hogar", unidad: "UNIDADES" as const },
    { nombre: "Tablas de cortar",             cat: "Artículos del hogar", unidad: "UNIDADES" as const },
    { nombre: "Recipientes herméticos / tappers", cat: "Artículos del hogar", unidad: "UNIDADES" as const },
    { nombre: "Termo / botella térmica",      cat: "Artículos del hogar", unidad: "UNIDADES" as const },
    { nombre: "Hieleras / coolers",           cat: "Artículos del hogar", unidad: "UNIDADES" as const },
    { nombre: "Lámparas a pilas",             cat: "Artículos del hogar", unidad: "UNIDADES" as const },
    { nombre: "Mosquiteros",                  cat: "Artículos del hogar", unidad: "UNIDADES" as const },
    { nombre: "Cubos / baldes",               cat: "Artículos del hogar", unidad: "UNIDADES" as const },
    { nombre: "Hamacas",                      cat: "Artículos del hogar", unidad: "UNIDADES" as const },
    { nombre: "Coladores",                    cat: "Artículos del hogar", unidad: "UNIDADES" as const },
    { nombre: "Manteles",                     cat: "Artículos del hogar", unidad: "UNIDADES" as const },
    { nombre: "Espejos",                      cat: "Artículos del hogar", unidad: "UNIDADES" as const },

    // ── Herramientas y equipos ───────────────────────────────────────
    { nombre: "Linternas",                    cat: "Herramientas y equipos", unidad: "UNIDADES" as const },
    { nombre: "Pilas AA",                     cat: "Herramientas y equipos", unidad: "UNIDADES" as const },
    { nombre: "Pilas D (grandes)",            cat: "Herramientas y equipos", unidad: "UNIDADES" as const },
    { nombre: "Palas",                        cat: "Herramientas y equipos", unidad: "UNIDADES" as const },
    { nombre: "Picos",                        cat: "Herramientas y equipos", unidad: "UNIDADES" as const },
    { nombre: "Lonas plásticas",              cat: "Herramientas y equipos", unidad: "UNIDADES" as const },
    { nombre: "Cuerda / soga",                cat: "Herramientas y equipos", unidad: "UNIDADES" as const },
    { nombre: "Martillos",                    cat: "Herramientas y equipos", unidad: "UNIDADES" as const },
    { nombre: "Destornilladores",             cat: "Herramientas y equipos", unidad: "UNIDADES" as const },
    { nombre: "Llaves ajustables / inglesas", cat: "Herramientas y equipos", unidad: "UNIDADES" as const },
    { nombre: "Alicates / pinzas",            cat: "Herramientas y equipos", unidad: "UNIDADES" as const },
    { nombre: "Serruchos / sierras",          cat: "Herramientas y equipos", unidad: "UNIDADES" as const },
    { nombre: "Hachas",                       cat: "Herramientas y equipos", unidad: "UNIDADES" as const },
    { nombre: "Machetes",                     cat: "Herramientas y equipos", unidad: "UNIDADES" as const },
    { nombre: "Carretillas",                  cat: "Herramientas y equipos", unidad: "UNIDADES" as const },
    { nombre: "Escaleras",                    cat: "Herramientas y equipos", unidad: "UNIDADES" as const },
    { nombre: "Tijeras",                      cat: "Herramientas y equipos", unidad: "UNIDADES" as const },
    { nombre: "Cinta métrica",                cat: "Herramientas y equipos", unidad: "UNIDADES" as const },
    { nombre: "Nivel",                        cat: "Herramientas y equipos", unidad: "UNIDADES" as const },
    { nombre: "Clavos",                       cat: "Herramientas y equipos", unidad: "KG"       as const },
    { nombre: "Tornillos",                    cat: "Herramientas y equipos", unidad: "KG"       as const },
    { nombre: "Alambre",                      cat: "Herramientas y equipos", unidad: "KG"       as const },
    { nombre: "Cinta adhesiva / duct tape",   cat: "Herramientas y equipos", unidad: "UNIDADES" as const },
    { nombre: "Cadenas",                      cat: "Herramientas y equipos", unidad: "UNIDADES" as const },
    { nombre: "Candados",                     cat: "Herramientas y equipos", unidad: "UNIDADES" as const },
    { nombre: "Pilas AAA",                    cat: "Herramientas y equipos", unidad: "UNIDADES" as const },
    { nombre: "Pilas tipo botón",             cat: "Herramientas y equipos", unidad: "UNIDADES" as const },
    { nombre: "Power banks / baterías externas", cat: "Herramientas y equipos", unidad: "UNIDADES" as const },
    { nombre: "Generadores eléctricos",       cat: "Herramientas y equipos", unidad: "UNIDADES" as const },
    { nombre: "Extensiones / multitomas",     cat: "Herramientas y equipos", unidad: "UNIDADES" as const },
    { nombre: "Bombillos / focos LED",        cat: "Herramientas y equipos", unidad: "UNIDADES" as const },
    { nombre: "Radios a pilas",               cat: "Herramientas y equipos", unidad: "UNIDADES" as const },
    { nombre: "Walkie-talkies",               cat: "Herramientas y equipos", unidad: "UNIDADES" as const },
    { nombre: "Silbatos",                     cat: "Herramientas y equipos", unidad: "UNIDADES" as const },
    { nombre: "Cascos de seguridad",          cat: "Herramientas y equipos", unidad: "UNIDADES" as const },
    { nombre: "Mascarillas de polvo",         cat: "Herramientas y equipos", unidad: "UNIDADES" as const },
    { nombre: "Lentes de protección",         cat: "Herramientas y equipos", unidad: "UNIDADES" as const },
    { nombre: "Guantes de trabajo",           cat: "Herramientas y equipos", unidad: "UNIDADES" as const },
    { nombre: "Botas de seguridad",           cat: "Herramientas y equipos", unidad: "UNIDADES" as const },
    { nombre: "Carpas / tiendas de campaña",  cat: "Herramientas y equipos", unidad: "UNIDADES" as const },
    { nombre: "Sacos de dormir",              cat: "Herramientas y equipos", unidad: "UNIDADES" as const },
    { nombre: "Filtros de agua portátiles",   cat: "Herramientas y equipos", unidad: "UNIDADES" as const },
    { nombre: "Pastillas potabilizadoras",    cat: "Herramientas y equipos", unidad: "UNIDADES" as const },
    { nombre: "Linternas frontales / de cabeza", cat: "Herramientas y equipos", unidad: "UNIDADES" as const },
    { nombre: "Cargadores solares",           cat: "Herramientas y equipos", unidad: "UNIDADES" as const },
    { nombre: "Cinta de señalización",        cat: "Herramientas y equipos", unidad: "UNIDADES" as const },

    // ── Limpieza y desinfección ──────────────────────────────────────
    { nombre: "Cloro / lejía",                cat: "Limpieza y desinfección", unidad: "LITROS"   as const },
    { nombre: "Desinfectante",                cat: "Limpieza y desinfección", unidad: "LITROS"   as const },
    { nombre: "Detergente en polvo",          cat: "Limpieza y desinfección", unidad: "KG"       as const },
    { nombre: "Escoba y recogedor",           cat: "Limpieza y desinfección", unidad: "UNIDADES" as const },
    { nombre: "Bolsas de basura (paq.)",      cat: "Limpieza y desinfección", unidad: "UNIDADES" as const },
    { nombre: "Jabón lavaplatos / lavavajillas", cat: "Limpieza y desinfección", unidad: "LITROS" as const },
    { nombre: "Detergente líquido",           cat: "Limpieza y desinfección", unidad: "LITROS"   as const },
    { nombre: "Suavizante de ropa",           cat: "Limpieza y desinfección", unidad: "LITROS"   as const },
    { nombre: "Esponjas / estropajos",        cat: "Limpieza y desinfección", unidad: "UNIDADES" as const },
    { nombre: "Trapos / paños de limpieza",   cat: "Limpieza y desinfección", unidad: "UNIDADES" as const },
    { nombre: "Cepillos de limpieza",         cat: "Limpieza y desinfección", unidad: "UNIDADES" as const },
    { nombre: "Guantes de limpieza",          cat: "Limpieza y desinfección", unidad: "UNIDADES" as const },
    { nombre: "Limpiavidrios",                cat: "Limpieza y desinfección", unidad: "LITROS"   as const },
    { nombre: "Limpiador multiusos",          cat: "Limpieza y desinfección", unidad: "LITROS"   as const },
    { nombre: "Quitamanchas",                 cat: "Limpieza y desinfección", unidad: "LITROS"   as const },
    { nombre: "Insecticida / aerosol",        cat: "Limpieza y desinfección", unidad: "UNIDADES" as const },
    { nombre: "Trampas para insectos",        cat: "Limpieza y desinfección", unidad: "UNIDADES" as const },
    { nombre: "Trapeador / mopa",             cat: "Limpieza y desinfección", unidad: "UNIDADES" as const },
    { nombre: "Aromatizantes / ambientadores",cat: "Limpieza y desinfección", unidad: "UNIDADES" as const },
    { nombre: "Gel antibacterial",            cat: "Limpieza y desinfección", unidad: "LITROS"   as const },
    { nombre: "Alcohol en gel",               cat: "Limpieza y desinfección", unidad: "LITROS"   as const },

    // ── Alimento para mascotas ───────────────────────────────────────
    { nombre: "Alimento para perros",         cat: "Alimento para mascotas", unidad: "KG"       as const },
    { nombre: "Alimento para gatos",          cat: "Alimento para mascotas", unidad: "KG"       as const },
    { nombre: "Comida húmeda para mascota (lata)", cat: "Alimento para mascotas", unidad: "UNIDADES" as const },
    { nombre: "Premios / snacks para perros", cat: "Alimento para mascotas", unidad: "KG"       as const },
    { nombre: "Premios / snacks para gatos",  cat: "Alimento para mascotas", unidad: "KG"       as const },
    { nombre: "Leche para cachorros",         cat: "Alimento para mascotas", unidad: "LITROS"   as const },
    { nombre: "Alimento para aves",           cat: "Alimento para mascotas", unidad: "KG"       as const },
    { nombre: "Alimento para peces",          cat: "Alimento para mascotas", unidad: "UNIDADES" as const },
    { nombre: "Alimento para roedores",       cat: "Alimento para mascotas", unidad: "KG"       as const },

    // ── Artículos para mascotas ──────────────────────────────────────
    { nombre: "Arena para gatos",             cat: "Artículos para mascotas", unidad: "KG"       as const },
    { nombre: "Correas y collares",           cat: "Artículos para mascotas", unidad: "UNIDADES" as const },
    { nombre: "Comederos / bebederos",        cat: "Artículos para mascotas", unidad: "UNIDADES" as const },
    { nombre: "Camas / mantas para mascota",  cat: "Artículos para mascotas", unidad: "UNIDADES" as const },
    { nombre: "Medicinas veterinarias",       cat: "Artículos para mascotas", unidad: "UNIDADES" as const },
    { nombre: "Champú para mascotas",         cat: "Artículos para mascotas", unidad: "LITROS"   as const },
    { nombre: "Cepillo para mascotas",        cat: "Artículos para mascotas", unidad: "UNIDADES" as const },
    { nombre: "Juguetes para mascotas",       cat: "Artículos para mascotas", unidad: "UNIDADES" as const },
    { nombre: "Transportadoras / kennel",     cat: "Artículos para mascotas", unidad: "UNIDADES" as const },
    { nombre: "Bozales",                      cat: "Artículos para mascotas", unidad: "UNIDADES" as const },
    { nombre: "Pañales para mascotas",        cat: "Artículos para mascotas", unidad: "UNIDADES" as const },
    { nombre: "Pipetas antipulgas",           cat: "Artículos para mascotas", unidad: "UNIDADES" as const },
    { nombre: "Vitaminas para mascotas",      cat: "Artículos para mascotas", unidad: "UNIDADES" as const },
    { nombre: "Paños higiénicos para mascotas (wee-wee pads)", cat: "Artículos para mascotas", unidad: "UNIDADES" as const },
    { nombre: "Toallas para mascotas",        cat: "Artículos para mascotas", unidad: "UNIDADES" as const },
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
