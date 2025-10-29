// // Exemplo de uso dos schemas Zod nos controllers

// import { Controller, Post, Get, Body, Query } from '@nestjs/common';
// import { usePipe } from 'src/common/pipes';
// import {
//   // Auth schemas
//   registerSchema,
//   loginSchema,
//   RegisterInput,
//   LoginInput,

//   // User schemas
//   createUserSchema,
//   listUsersQuerySchema,
//   searchUsersQuerySchema,
//   CreateUserInput,
//   ListUsersQuery,
//   SearchUsersQuery,
// } from 'src/common/schemas';

// // ========================================
// // Exemplo 1: Auth Controller
// // ========================================

// @Controller('auth')
// export class AuthControllerExample {
//   @Post('register')
//   register(@Body(usePipe(registerSchema)) data: RegisterInput) {
//     // data já está validado e tipado
//     return { email: data.email, name: data.name };
//   }

//   @Post('login')
//   login(@Body(usePipe(loginSchema)) data: LoginInput) {
//     // data.email já está em lowercase e trimmed
//     return { email: data.email };
//   }
// }

// // ========================================
// // Exemplo 2: Users Controller
// // ========================================

// @Controller('users')
// export class UsersControllerExample {
//   // POST /users - Criar usuário
//   @Post()
//   create(@Body(usePipe(createUserSchema)) data: CreateUserInput) {
//     // data.roles terá [Role.USER] como padrão se não fornecido
//     return data;
//   }

//   // GET /users?page=1&limit=10&isActive=true&role=ADMIN
//   @Get()
//   findAll(@Query(usePipe(listUsersQuerySchema)) query: ListUsersQuery) {
//     // query.page e query.limit são números
//     // query.isActive é boolean
//     return {
//       page: query.page,
//       limit: query.limit,
//       isActive: query.isActive,
//       role: query.role,
//     };
//   }

//   // GET /users/search?q=john&page=1&limit=10
//   @Get('search')
//   search(@Query(usePipe(searchUsersQuerySchema)) query: SearchUsersQuery) {
//     // query.q está validado
//     // query.page e query.limit são números
//     return {
//       query: query.q,
//       page: query.page,
//       limit: query.limit,
//     };
//   }
// }

// // ========================================
// // Exemplo 3: Validação customizada
// // ========================================

// import { z } from 'zod';

// // Schema com validação complexa
// const customSchema = z
//   .object({
//     password: z.string().min(6),
//     confirmPassword: z.string(),
//   })
//   .refine((data) => data.password === data.confirmPassword, {
//     message: 'Senhas não conferem',
//     path: ['confirmPassword'], // Campo que receberá o erro
//   });

// type CustomInput = z.infer<typeof customSchema>;

// @Controller('example')
// export class CustomValidationExample {
//   @Post()
//   createWithConfirmation(@Body(usePipe(customSchema)) data: CustomInput) {
//     // Se chegar aqui, as senhas conferem
//     return { success: true };
//   }
// }

// // ========================================
// // Exemplo 4: Query params opcionais
// // ========================================

// const optionalQuerySchema = z.object({
//   page: z.string().regex(/^\d+$/).default('1').transform(Number),
//   search: z.string().optional(), // Opcional
//   sortBy: z.enum(['name', 'date', 'price']).default('name'),
// });

// type OptionalQuery = z.infer<typeof optionalQuerySchema>;

// @Controller('products')
// export class ProductsExample {
//   @Get()
//   list(@Query(usePipe(optionalQuerySchema)) query: OptionalQuery) {
//     // query.page sempre terá valor (1 por padrão)
//     // query.search pode ser undefined
//     // query.sortBy sempre terá valor ('name' por padrão)
//     return query;
//   }
// }
