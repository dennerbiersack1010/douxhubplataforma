import * as zod from 'zod'

const trimmedText = (minimum: number, maximum: number) =>
  zod.string().trim().min(minimum).max(maximum)

const optionalText = (maximum: number) =>
  zod.string().trim().max(maximum).optional().transform((value) => value || undefined)

const phoneSchema = zod.string()
  .trim()
  .min(8)
  .max(24)
  .regex(/^\+?[0-9()\-\s]+$/)

const postalCodeSchema = zod.string()
  .transform((value) => value.replace(/\D/g, ''))
  .refine((value) => value.length === 8, 'invalid_postal_code')

function isValidCnpj(value: string) {
  if (!/^\d{14}$/.test(value) || /^(\d)\1{13}$/.test(value)) return false
  const calculateDigit = (base: string, weights: number[]) => {
    const sum = base.split('').reduce((total, digit, index) => total + Number(digit) * weights[index], 0)
    const remainder = sum % 11
    return remainder < 2 ? 0 : 11 - remainder
  }
  const first = calculateDigit(value.slice(0, 12), [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2])
  const second = calculateDigit(value.slice(0, 12) + first, [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2])
  return value.endsWith(`${first}${second}`)
}

const cnpjSchema = zod.string()
  .transform((value) => value.replace(/\D/g, ''))
  .refine(isValidCnpj, 'invalid_cnpj')

function isValidTimeZone(value: string) {
  try {
    new Intl.DateTimeFormat('pt-BR', { timeZone: value }).format()
    return true
  } catch {
    return false
  }
}

const weekDaySchema = zod.enum([
  'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday',
])

const timeSchema = zod.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/)

const addressSchema = zod.object({
  postalCode: postalCodeSchema,
  street: trimmedText(2, 160),
  number: trimmedText(1, 30),
  complement: optionalText(100),
  district: trimmedText(2, 100),
  city: trimmedText(2, 100),
  state: zod.string().trim().toUpperCase().length(2),
}).strict()

export const ownerOnboardingSchema = zod.object({
  fullName: trimmedText(3, 160),
  phone: phoneSchema,
  avatarUrl: zod.string().url().max(2048).nullable().optional(),
  jobTitle: trimmedText(2, 100),
  responsibilityConfirmed: zod.literal(true),
  notifications: zod.object({
    email: zod.boolean(),
    push: zod.boolean(),
    whatsapp: zod.boolean(),
  }).strict(),
}).strict()

export const clinicOnboardingSchema = zod.object({
  tradeName: trimmedText(2, 160),
  legalName: trimmedText(2, 200),
  cnpj: cnpjSchema,
  phone: phoneSchema,
  email: zod.string().trim().toLowerCase().email().max(254),
  logoUrl: zod.string().url().max(2048).nullable().optional(),
  fiscalAddress: addressSchema,
  legalResponsible: trimmedText(3, 160),
  technicalResponsible: optionalText(160),
  clinicType: trimmedText(2, 100),
  specialties: zod.array(trimmedText(2, 100)).min(1).max(30),
}).strict()

export const unitOnboardingSchema = zod.object({
  name: trimmedText(2, 160),
  phone: phoneSchema,
  address: addressSchema,
  timeZone: zod.string().trim().min(3).max(100).refine(isValidTimeZone, 'invalid_time_zone'),
  internalCode: optionalText(60),
  rooms: zod.array(trimmedText(1, 100)).max(50).default([]),
}).strict()

export const operationOnboardingSchema = zod.object({
  workingDays: zod.array(weekDaySchema).min(1).max(7),
  opensAt: timeSchema,
  closesAt: timeSchema,
  defaultAppointmentMinutes: zod.number().int().min(5).max(480),
  intervalMinutes: zod.number().int().min(0).max(180),
  minimumAdvanceHours: zod.number().int().min(0).max(2160),
  confirmationPolicy: trimmedText(2, 500),
  cancellationPolicy: trimmedText(2, 1000),
  paymentMethods: zod.array(zod.enum([
    'pix', 'cash', 'credit_card', 'debit_card', 'bank_transfer', 'installments', 'other',
  ])).min(1).max(7),
}).strict().refine((value) => value.closesAt > value.opensAt, {
  message: 'closing_time_must_be_after_opening_time',
  path: ['closesAt'],
})

export const teamPreparationOnboardingSchema = zod.object({
  nextAction: zod.enum(['add_reception', 'add_professional', 'later']),
}).strict()

export const onboardingStepSchemas = {
  1: ownerOnboardingSchema,
  2: clinicOnboardingSchema,
  3: unitOnboardingSchema,
  4: operationOnboardingSchema,
  5: teamPreparationOnboardingSchema,
} as const

export type OnboardingStep = keyof typeof onboardingStepSchemas

export function isOnboardingStep(value: number): value is OnboardingStep {
  return Number.isInteger(value) && value >= 1 && value <= 5
}

export function validateOnboardingStep(step: OnboardingStep, payload: unknown) {
  return onboardingStepSchemas[step].safeParse(payload)
}

export const onboardingSaveRequestSchema = zod.object({
  progressId: zod.string().uuid(),
  step: zod.number().int().min(1).max(5),
  payload: zod.unknown(),
}).strict()

export const onboardingCancelRequestSchema = zod.object({
  progressId: zod.string().uuid(),
}).strict()

