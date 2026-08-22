import { mirror } from "../src/blob";
import { db } from "../src/client";
import { resolveFavicon } from "../src/favicon";
import {
	ActivityType,
	DealStage,
	RateSource,
} from "../src/generated/prisma/enums";
import { readReportingCurrency, SETTINGS_ID } from "../src/settings";

function makeRandom(seed: number): () => number {
	let a = seed;
	return () => {
		a = (a + 0x6d2b79f5) | 0;
		let t = Math.imul(a ^ (a >>> 15), 1 | a);
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

const random = makeRandom(20260821);

function pick<T>(items: readonly T[]): T {
	const item = items[Math.floor(random() * items.length)];
	if (item === undefined) throw new Error("pick() on an empty list");
	return item;
}

function chance(probability: number): boolean {
	return random() < probability;
}

function integer(min: number, max: number): number {
	return min + Math.floor(random() * (max - min + 1));
}

const DAY_MS = 24 * 60 * 60 * 1000;
const NOW = Date.now();

function daysFromNow(days: number, jitterHours = 0): Date {
	const jitter = jitterHours
		? (random() - 0.5) * jitterHours * 60 * 60 * 1000
		: 0;
	return new Date(NOW + days * DAY_MS + jitter);
}

type SeedCompany = {
	name: string;
	domain: string;
	industry: string;
	city: string;
	country: string;
	countryCode: string;
};

const COMPANIES: readonly SeedCompany[] = [
	{
		name: "OXXO",
		domain: "oxxo.com",
		industry: "Tiendas de conveniencia",
		city: "Monterrey",
		country: "Mexico",
		countryCode: "MX",
	},
	{
		name: "Walmart de México",
		domain: "walmex.mx",
		industry: "Autoservicio",
		city: "Ciudad de México",
		country: "Mexico",
		countryCode: "MX",
	},
	{
		name: "Soriana",
		domain: "soriana.com",
		industry: "Autoservicio",
		city: "Monterrey",
		country: "Mexico",
		countryCode: "MX",
	},
	{
		name: "Chedraui",
		domain: "chedraui.com.mx",
		industry: "Autoservicio",
		city: "Ciudad de México",
		country: "Mexico",
		countryCode: "MX",
	},
	{
		name: "La Comer",
		domain: "lacomer.com.mx",
		industry: "Autoservicio",
		city: "Ciudad de México",
		country: "Mexico",
		countryCode: "MX",
	},
	{
		name: "Casa Ley",
		domain: "casaley.com.mx",
		industry: "Autoservicio",
		city: "Culiacán",
		country: "Mexico",
		countryCode: "MX",
	},
	{
		name: "Tiendas 3B",
		domain: "tiendas3b.com",
		industry: "Tiendas de descuento",
		city: "Ciudad de México",
		country: "Mexico",
		countryCode: "MX",
	},
	{
		name: "7-Eleven México",
		domain: "7-eleven.com.mx",
		industry: "Tiendas de conveniencia",
		city: "Monterrey",
		country: "Mexico",
		countryCode: "MX",
	},
	{
		name: "HEB México",
		domain: "heb.com.mx",
		industry: "Autoservicio",
		city: "Monterrey",
		country: "Mexico",
		countryCode: "MX",
	},
	{
		name: "Calimax",
		domain: "calimax.com.mx",
		industry: "Autoservicio",
		city: "Tijuana",
		country: "Mexico",
		countryCode: "MX",
	},
	{
		name: "Grupo Merza",
		domain: "merza.com.mx",
		industry: "Mayoreo y abarrotes",
		city: "Zamora",
		country: "Mexico",
		countryCode: "MX",
	},
	{
		name: "Cinépolis",
		domain: "cinepolis.com",
		industry: "Entretenimiento",
		city: "Morelia",
		country: "Mexico",
		countryCode: "MX",
	},
	{
		name: "MexGrocer",
		domain: "mexgrocer.com",
		industry: "Importación de alimentos",
		city: "San Diego",
		country: "United States",
		countryCode: "US",
	},
];

const FIRST_NAMES = [
	"Alejandra",
	"Carlos",
	"Daniela",
	"Eduardo",
	"Fernanda",
	"Gerardo",
	"Ismael",
	"Jimena",
	"Lorena",
	"Mauricio",
	"Norma",
	"Octavio",
	"Paola",
	"Ricardo",
	"Sofía",
	"Tomás",
	"Valeria",
	"Xavier",
] as const;

const LAST_NAMES = [
	"Aguilar",
	"Bautista",
	"Cervantes",
	"Domínguez",
	"Espinoza",
	"Fuentes",
	"Galindo",
	"Herrera",
	"Ibarra",
	"Juárez",
	"Lozano",
	"Medina",
	"Navarro",
	"Ortega",
	"Preciado",
	"Quiroz",
	"Rangel",
	"Salazar",
	"Treviño",
	"Vázquez",
] as const;

const TITLES = [
	"Comprador de Botanas",
	"Gerente de Categoría Snacks",
	"Jefe de Abarrotes",
	"Director Comercial",
	"Gerente de Compras",
	"Category Manager",
	"Gerente de Dulcería",
	"Gerente de Importaciones",
	"Jefe de Marca Propia",
] as const;

type SeedDeal = {
	company: string;
	name: string;
	description: string;
	amountMxn: number;
	stage: DealStage;
	lostReason?: string;
};

const DEALS: readonly SeedDeal[] = [
	{
		company: "OXXO",
		name: "OXXO — Japonés 13g impulso nacional",
		description:
			"Listado nacional del sachet de 13g de Cacahuate Japonés en zona de cajas. La prueba en plaza Monterrey superó el objetivo de rotación.",
		amountMxn: 7800000,
		stage: DealStage.CONTRACT_SENT,
	},
	{
		company: "OXXO",
		name: "OXXO — Pikanuts pouch 800g prueba regional",
		description:
			"Prueba del pouch re sellable de 800g de Pikanuts en 240 tiendas del Bajío. Si la rotación aguanta, escala a Occidente.",
		amountMxn: 1450000,
		stage: DealStage.QUALIFIED_TO_BUY,
	},
	{
		company: "Walmart de México",
		name: "Walmart — Línea Crujiente 800g (Habanero, Chipotle, Queso)",
		description:
			"Tres sabores de cacahuate cubierto crujiente en bolsa de 800g para Bodega Aurrerá. Caja de 24 bolsas, tarima de 45 cajas.",
		amountMxn: 5200000,
		stage: DealStage.DECISION_MAKER_BOUGHT_IN,
	},
	{
		company: "Soriana",
		name: "Soriana — Frito con Sal 800g resurtido anual",
		description:
			"Renovación anual del cacahuate frito con sal en sachet de 800g para todas las plazas del norte.",
		amountMxn: 3900000,
		stage: DealStage.CLOSED_WON,
	},
	{
		company: "Soriana",
		name: "Soriana — Torcirey 3 sabores 900g",
		description:
			"Entrada del snack de maíz extruido Torcirey (Cheddar, Fuego, Blue Dragon) en bolsa de 900g, 5 bolsas por caja.",
		amountMxn: 1200000,
		stage: DealStage.DEMO_BOOKED,
	},
	{
		company: "Chedraui",
		name: "Chedraui — Pop's del Rey 470g cuatro sabores",
		description:
			"Palomitas Pop's del Rey en 470g: Sal, Mantequilla, Fuego y Queso Cheddar. Exhibición en cabecera para el mundial.",
		amountMxn: 2100000,
		stage: DealStage.QUALIFIED_TO_BUY,
	},
	{
		company: "La Comer",
		name: "La Comer — Martajado y Español selección",
		description:
			"Cacahuate martajado y español de 800g para el segmento gourmet de City Market y Fresko.",
		amountMxn: 860000,
		stage: DealStage.DECISION_MAKER_BOUGHT_IN,
	},
	{
		company: "Casa Ley",
		name: "Casa Ley — Cantinero mix noroeste",
		description:
			"Cacahuate cantinero frito con especias en 800g para el noroeste. Piden apoyo de exhibición en temporada de béisbol.",
		amountMxn: 940000,
		stage: DealStage.QUALIFIED_TO_BUY,
	},
	{
		company: "Tiendas 3B",
		name: "Tiendas 3B — cotización marca propia Japonés",
		description:
			"Cotizaron el japonés de 800g como marca propia. El margen pedido no deja mantener el estándar de calidad; se declinó.",
		amountMxn: 2600000,
		stage: DealStage.CLOSED_LOST,
		lostReason: "Margen de marca propia fuera de rango",
	},
	{
		company: "7-Eleven México",
		name: "7-Eleven — Japonés 13g zona de cajas",
		description:
			"Sachet de 13g de japonés en punto de venta de cajas. Compite contra el incumbente por dos frentes de anaquel.",
		amountMxn: 1150000,
		stage: DealStage.DEMO_BOOKED,
	},
	{
		company: "HEB México",
		name: "HEB — Crujientes Jalapeño y Nacho 800g",
		description:
			"Dos sabores de cubierto crujiente en pouch re sellable de 800g para plazas de Nuevo León y Tamaulipas.",
		amountMxn: 1350000,
		stage: DealStage.CONTRACT_SENT,
	},
	{
		company: "Calimax",
		name: "Calimax — Frito con Chile y Especias 800g",
		description:
			"Cacahuate frito con chile y especias para Baja California. Entrega en cedis Tijuana, tarima de 45 cajas.",
		amountMxn: 680000,
		stage: DealStage.CLOSED_WON,
	},
	{
		company: "Grupo Merza",
		name: "Merza — Képulpa mayoreo (Varipulpa y Paletota)",
		description:
			"Dulces de tamarindo con chile Képulpa para mayoreo: Varipulpa en vitrolero de 900g y Paletota de 60g por caja de 12 bolsas.",
		amountMxn: 780000,
		stage: DealStage.QUALIFIED_TO_BUY,
	},
	{
		company: "Grupo Merza",
		name: "Merza — Pomito y Cubiertitas dulcerías",
		description:
			"Pomito de 45g y Cubiertitas de tamarindo para manzana en contenedor de 500g, ruta de dulcerías de Michoacán y Jalisco.",
		amountMxn: 430000,
		stage: DealStage.DEMO_BOOKED,
	},
	{
		company: "Cinépolis",
		name: "Cinépolis — Pop's del Rey dulcería",
		description:
			"Palomitas embolsadas Pop's del Rey como SKU de dulcería fuera de sala. Piden empaque con ventana de marca compartida.",
		amountMxn: 1600000,
		stage: DealStage.DEMO_BOOKED,
	},
	{
		company: "MexGrocer",
		name: "MexGrocer — Exportación FDA Japonés y Pikanuts",
		description:
			"Primer contenedor de exportación a EE.UU. amparado por registro FDA: japonés 800g y Pikanuts. Incoterm DAP San Diego.",
		amountMxn: 2900000,
		stage: DealStage.QUALIFIED_TO_BUY,
	},
];

type HistoricalPurchase = {
	company: string;
	product: string;
	daysAgo: readonly number[];
};

const HISTORICAL_PURCHASES: readonly HistoricalPurchase[] = [
	{
		company: "OXXO",
		product: "Japonés 13g",
		daysAgo: [240, 210, 180, 150, 120, 45],
	},
	{
		company: "Casa Ley",
		product: "Cantinero",
		daysAgo: [200, 160, 120, 60],
	},
	{
		company: "HEB México",
		product: "Crujientes 800g",
		daysAgo: [240, 210, 180, 150],
	},
	{
		company: "Chedraui",
		product: "Pop's del Rey 470g",
		daysAgo: [240, 206, 172, 138, 104, 40],
	},
	{
		company: "Grupo Merza",
		product: "Képulpa",
		daysAgo: [240, 192, 144, 96, 53],
	},
	{
		company: "Soriana",
		product: "Frito con Sal 800g",
		daysAgo: [245, 200, 155, 110, 65],
	},
	{
		company: "Calimax",
		product: "Frito con Chile y Especias 800g",
		daysAgo: [245, 200, 155, 110, 65],
	},
];

const MONTH_FORMATTER = new Intl.DateTimeFormat("es-MX", { month: "long" });

const NOTE_BODIES = [
	"Revisamos el catálogo 2026 completo. Les interesa el pouch re sellable de 800g como diferenciador de anaquel.",
	"Piden ficha logística: caja de 24 bolsas de 800g, tarima de 6 camas con 45 cajas, 868.5 kg por tarima.",
	"El comprador confirmó que la cobertura logística del 52% del territorio nacional cubre sus cedis.",
	"Comparativa contra el incumbente: la relación precio-calidad del japonés quedó arriba en el panel de cata.",
	"Solicitan certificados COFEPRIS y el registro FDA para el expediente de proveedor.",
	"Quieren exclusiva regional de Blue Dragon por seis meses. Se evalúa con dirección.",
	"El área de calidad pidió visita a la planta de Aguascalientes antes de firmar.",
] as const;

const CALL_SUBJECTS = [
	"Llamada de descubrimiento",
	"Revisión de catálogo 2026",
	"Negociación de precio por tarima",
	"Seguimiento de pedido de prueba",
	"Revisión logística de cedis",
] as const;

const TASK_SUBJECTS = [
	"Enviar ficha técnica y ficha logística",
	"Mandar muestras del pouch 800g",
	"Cotizar tarima completa por sabor",
	"Agendar visita a planta Aguascalientes",
	"Enviar certificados COFEPRIS y FDA",
	"Confirmar fecha de entrega en cedis",
] as const;

const MEETING_SUBJECTS = [
	"Presentación de catálogo 2026",
	"Cata de producto con compras",
	"Revisión trimestral de categoría",
	"Alineación con logística",
] as const;

const EMAIL_SUBJECTS = [
	"Re: siguientes pasos",
	"Seguimiento a la cata de producto",
	"Precios y condiciones por tarima",
	"Ficha logística actualizada",
] as const;

const TRANSLITERATIONS: Record<string, string> = {
	ø: "o",
	æ: "ae",
	œ: "oe",
	å: "a",
	ß: "ss",
};

function slug(value: string): string {
	return value
		.toLowerCase()
		.replace(/[øæœåß]/g, (char) => TRANSLITERATIONS[char] ?? char)
		.normalize("NFD")
		.replace(/\p{Mn}/gu, "")
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-|-$/g, "");
}

const MXN_TO_USD = 0.054;

let seedBase = "USD";

async function wipe(): Promise<void> {
	await db.activity.deleteMany({});
	await db.dealContact.deleteMany({});
	await db.deal.deleteMany({});
	await db.agentTask.deleteMany({});
	await db.company.updateMany({ data: { primaryContactId: null } });
	await db.contact.deleteMany({});
	await db.company.deleteMany({});
	console.log("Wiped previous demo pipeline.");
}

async function seedRates(): Promise<void> {
	await db.appSetting.upsert({
		where: { id: SETTINGS_ID },
		create: { id: SETTINGS_ID, reportingCurrency: "USD" },
		update: {},
		select: { id: true },
	});

	seedBase = await readReportingCurrency(db);

	await db.exchangeRate.upsert({
		where: {
			baseCurrency_quoteCurrency_source: {
				baseCurrency: "USD",
				quoteCurrency: "MXN",
				source: RateSource.FETCHED,
			},
		},
		create: {
			baseCurrency: "USD",
			quoteCurrency: "MXN",
			rate: MXN_TO_USD,
			asOf: daysFromNow(-1),
			source: RateSource.FETCHED,
			provider: "seed",
		},
		update: { rate: MXN_TO_USD, asOf: daysFromNow(-1), provider: "seed" },
	});
}

function money(amountMxn: number) {
	const converted =
		seedBase === "USD"
			? {
					baseAmount: Number((amountMxn * MXN_TO_USD).toFixed(2)),
					fxRate: MXN_TO_USD,
				}
			: seedBase === "MXN"
				? { baseAmount: amountMxn, fxRate: 1 }
				: null;

	return {
		amount: amountMxn,
		currency: "MXN",
		baseAmount: converted?.baseAmount ?? null,
		baseCurrency: converted ? seedBase : null,
		fxRate: converted?.fxRate ?? null,
	};
}

const REP_RENAMES = [
	{ name: "Francisco Mendoza", email: "francisco@cacahuatesdelrey.mx" },
	{ name: "Lucía Arellano", email: "lucia@cacahuatesdelrey.mx" },
	{ name: "Jorge Camarillo", email: "jorge@cacahuatesdelrey.mx" },
] as const;

async function seedOwners(): Promise<string[]> {
	const placeholders = await db.user.findMany({
		where: { id: { startsWith: "seed-" } },
		orderBy: { id: "asc" },
		select: { id: true },
	});
	for (const [index, user] of placeholders.entries()) {
		const rep = REP_RENAMES[index];
		if (!rep) break;
		await db.user.update({
			where: { id: user.id },
			data: { name: rep.name, email: rep.email },
		});
	}

	const existing = await db.user.findMany({ select: { id: true } });
	if (existing.length > 0) {
		console.log(`Using ${existing.length} existing user(s) as owners.`);
		return existing.map((user) => user.id);
	}

	const created = await db.user.upsert({
		where: { email: "ventas@cacahuatesdelrey.mx" },
		create: {
			id: "seed-ventas-del-rey",
			name: "Ventas Del Rey",
			email: "ventas@cacahuatesdelrey.mx",
			emailVerified: true,
			updatedAt: new Date(),
		},
		update: {},
		select: { id: true },
	});
	return [created.id];
}

async function seedCompanies(ownerIds: string[]) {
	const companies = [];

	for (const company of COMPANIES) {
		const row = await db.company.upsert({
			where: { domain: company.domain },
			create: {
				name: company.name,
				domain: company.domain,
				website: `https://${company.domain}`,
				industry: company.industry,
				city: company.city,
				country: company.country,
				countryCode: company.countryCode,
				ownerId: pick(ownerIds),
				createdAt: daysFromNow(-integer(30, 400), 12),
			},
			update: {},
			select: { id: true, name: true, domain: true, iconUrl: true },
		});
		companies.push({ ...row, domain: row.domain ?? company.domain });
	}

	const missing = companies.filter((company) => company.iconUrl === null);
	let resolved = 0;
	for (const company of missing) {
		const source = await resolveFavicon(company.domain);
		if (!source) continue;
		const iconUrl =
			(await mirror(source, `companies/${company.id}/icon`)) ?? source;
		await db.company.updateMany({
			where: { id: company.id, iconUrl: null },
			data: { iconUrl },
		});
		resolved += 1;
	}
	console.log(`Resolved ${resolved} of ${missing.length} company icons.`);

	return companies.map(({ iconUrl: _, ...company }) => company);
}

type SeededContact = { id: string; companyId: string };

async function seedContacts(
	companies: { id: string; domain: string }[],
	ownerIds: string[],
): Promise<SeededContact[]> {
	const contacts: SeededContact[] = [];
	const used = new Set<string>();

	for (const company of companies) {
		for (let index = 0; index < integer(2, 3); index++) {
			const firstName = pick(FIRST_NAMES);
			const lastName = pick(LAST_NAMES);
			const email = `${slug(firstName)}.${slug(lastName)}@${company.domain}`;
			if (used.has(email)) continue;
			used.add(email);

			const contact = await db.contact.upsert({
				where: { email },
				create: {
					firstName,
					lastName,
					email,
					title: pick(TITLES),
					phone: chance(0.5)
						? `+52 55 ${integer(1000, 9999)} ${integer(1000, 9999)}`
						: null,
					companyId: company.id,
					ownerId: pick(ownerIds),
					createdAt: daysFromNow(-integer(10, 300), 12),
				},
				update: {},
				select: { id: true },
			});

			contacts.push({ id: contact.id, companyId: company.id });
		}
	}

	for (const company of companies) {
		const first = contacts.find((contact) => contact.companyId === company.id);
		if (!first) continue;
		await db.company.update({
			where: { id: company.id },
			data: { primaryContactId: first.id },
		});
	}

	return contacts;
}

type SeededDeal = {
	id: string;
	companyId: string;
	ownerId: string;
	closed: boolean;
};

const CLOSED = new Set<DealStage>([
	DealStage.CLOSED_WON,
	DealStage.CLOSED_LOST,
	DealStage.UNQUALIFIED_TO_BUY,
]);

async function seedDeals(
	companies: { id: string; name: string }[],
	contacts: SeededContact[],
	ownerIds: string[],
): Promise<SeededDeal[]> {
	const byName = new Map(companies.map((company) => [company.name, company]));
	const deals: SeededDeal[] = [];

	for (const seed of DEALS) {
		const company = byName.get(seed.company);
		if (!company) throw new Error(`Unknown company: ${seed.company}`);

		const id = `delrey-${slug(seed.name)}`;
		const closed = CLOSED.has(seed.stage);
		const ownerId = pick(ownerIds);
		const createdDaysAgo = integer(20, 180);
		const closedDaysAgo = closed ? integer(3, 60) : null;
		const stageChangedAt = daysFromNow(
			closedDaysAgo === null ? -integer(1, 15) : -closedDaysAgo,
			12,
		);

		await db.deal.upsert({
			where: { id },
			create: {
				id,
				name: seed.name,
				description: seed.description,
				companyId: company.id,
				ownerId,
				stage: seed.stage,
				stageChangedAt,
				...(() => {
					const { amount, currency, baseAmount, baseCurrency, fxRate } = money(
						seed.amountMxn,
					);
					return {
						amount,
						currency,
						baseAmount,
						baseCurrency,
						fxRate,
						fxRateAt: fxRate === null ? null : daysFromNow(-1),
					};
				})(),
				expectedCloseDate: daysFromNow(
					closedDaysAgo === null ? integer(7, 75) : -closedDaysAgo + 5,
				),
				closedAt: closed ? stageChangedAt : null,
				closedReason: seed.lostReason ?? null,
				createdAt: daysFromNow(-createdDaysAgo, 12),
			},
			update: {},
		});

		const companyContacts = contacts.filter(
			(contact) => contact.companyId === company.id,
		);
		for (const contact of companyContacts.slice(0, integer(1, 2))) {
			await db.dealContact.upsert({
				where: { dealId_contactId: { dealId: id, contactId: contact.id } },
				create: {
					dealId: id,
					contactId: contact.id,
					role: chance(0.5) ? "Champion" : "Decisor",
				},
				update: {},
			});
		}

		deals.push({ id, companyId: company.id, ownerId, closed });
	}

	return deals;
}

async function seedHistoricalPurchases(
	companies: { id: string; name: string }[],
	ownerIds: string[],
): Promise<number> {
	const byName = new Map(companies.map((company) => [company.name, company]));
	let count = 0;

	for (const purchase of HISTORICAL_PURCHASES) {
		const company = byName.get(purchase.company);
		if (!company) throw new Error(`Unknown company: ${purchase.company}`);

		for (const [index, daysAgo] of purchase.daysAgo.entries()) {
			const id = `delrey-hist-${slug(company.name)}-${index + 1}`;
			const closedAt = daysFromNow(-daysAgo, 12);
			const month = MONTH_FORMATTER.format(closedAt);

			await db.deal.upsert({
				where: { id },
				create: {
					id,
					name: `Resurtido ${purchase.product} ${month}`,
					description: `Pedido de resurtido de ${purchase.product} para ${company.name}.`,
					companyId: company.id,
					ownerId: pick(ownerIds),
					stage: DealStage.CLOSED_WON,
					stageChangedAt: closedAt,
					closedAt,
					...(() => {
						const { amount, currency, baseAmount, baseCurrency, fxRate } =
							money(integer(200, 900) * 1000);
						return {
							amount,
							currency,
							baseAmount,
							baseCurrency,
							fxRate,
							fxRateAt: fxRate === null ? null : daysFromNow(-1),
						};
					})(),
					expectedCloseDate: daysFromNow(-daysAgo + 5, 12),
					createdAt: daysFromNow(-(daysAgo + integer(5, 15)), 12),
				},
				update: {},
			});

			count += 1;
		}
	}

	return count;
}

async function seedActivities(
	companies: { id: string }[],
	contacts: SeededContact[],
	deals: SeededDeal[],
	ownerIds: string[],
): Promise<number> {
	type ActivityRow = {
		type: ActivityType;
		subject: string | null;
		body: string | null;
		occurredAt: Date | null;
		dueAt: Date | null;
		completedAt: Date | null;
		companyId: string | null;
		contactId: string | null;
		dealId: string | null;
		createdById: string;
		createdAt: Date;
		meta?: { from: DealStage; to: DealStage };
	};

	const rows: ActivityRow[] = [];

	const base = (companyId: string, createdById: string, createdAt: Date) => ({
		companyId,
		contactId: null,
		dealId: null,
		occurredAt: null,
		dueAt: null,
		completedAt: null,
		subject: null,
		body: null,
		createdById,
		createdAt,
	});

	for (const deal of deals) {
		const dealContacts = contacts.filter((c) => c.companyId === deal.companyId);

		for (let n = 0; n < integer(3, 5); n++) {
			const at = daysFromNow(-integer(2, 120), 18);
			const type = pick([
				ActivityType.NOTE,
				ActivityType.CALL,
				ActivityType.EMAIL,
				ActivityType.MEETING,
			]);

			rows.push({
				...base(deal.companyId, deal.ownerId, at),
				type,
				dealId: deal.id,
				contactId: dealContacts.length > 0 ? pick(dealContacts).id : null,
				subject:
					type === ActivityType.CALL
						? pick(CALL_SUBJECTS)
						: type === ActivityType.MEETING
							? pick(MEETING_SUBJECTS)
							: type === ActivityType.EMAIL
								? pick(EMAIL_SUBJECTS)
								: null,
				body: type === ActivityType.NOTE ? pick(NOTE_BODIES) : null,
				occurredAt: type === ActivityType.NOTE ? null : at,
			});
		}

		rows.push({
			...base(deal.companyId, deal.ownerId, daysFromNow(-integer(1, 20), 12)),
			type: ActivityType.STAGE_CHANGE,
			dealId: deal.id,
			subject: "Stage changed",
			meta: {
				from: DealStage.DEMO_BOOKED,
				to: deal.closed ? DealStage.CLOSED_WON : DealStage.QUALIFIED_TO_BUY,
			},
		});

		if (!deal.closed) {
			for (let n = 0; n < integer(1, 2); n++) {
				const roll = random();
				const done = roll < 0.4;
				rows.push({
					...base(
						deal.companyId,
						deal.ownerId,
						daysFromNow(-integer(1, 30), 12),
					),
					type: ActivityType.TASK,
					dealId: deal.id,
					subject: pick(TASK_SUBJECTS),
					dueAt: done
						? daysFromNow(-integer(1, 20), 6)
						: daysFromNow(integer(1, 21), 6),
					completedAt: done ? daysFromNow(-integer(1, 10), 6) : null,
				});
			}
		}
	}

	for (const company of companies) {
		if (!chance(0.5)) continue;
		rows.push({
			...base(company.id, pick(ownerIds), daysFromNow(-integer(5, 200), 12)),
			type: ActivityType.NOTE,
			body: pick(NOTE_BODIES),
		});
	}

	await db.activity.createMany({ data: rows });
	return rows.length;
}

async function main() {
	await wipe();
	await seedRates();
	const ownerIds = await seedOwners();
	const companies = await seedCompanies(ownerIds);
	const contacts = await seedContacts(companies, ownerIds);
	const deals = await seedDeals(companies, contacts, ownerIds);
	const historicalPurchases = await seedHistoricalPurchases(
		companies,
		ownerIds,
	);
	const activities = await seedActivities(companies, contacts, deals, ownerIds);

	console.log(
		`Seeded ${companies.length} companies, ${contacts.length} contacts, ` +
			`${deals.length} deals, ${historicalPurchases} historical purchase deals, ` +
			`${activities} activities for Cacahuates del Rey.`,
	);
}

main()
	.catch((error) => {
		console.error(error);
		process.exitCode = 1;
	})
	.finally(async () => {
		await db.$disconnect();
	});
