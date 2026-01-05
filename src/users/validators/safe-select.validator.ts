import { Prisma } from "@prisma/client"

const safeUserSelect = Prisma.validator<Prisma.UserSelect>()({
    id: true,
    email: true,
    firstName: true,
    lastName: true,
    createdAt: true,
    updatedAt: true,
    role: true,
})

export default safeUserSelect
