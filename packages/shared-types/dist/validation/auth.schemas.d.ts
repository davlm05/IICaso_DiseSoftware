import { z } from 'zod';
export declare const RoleSchema: z.ZodEnum<["USER", "BACKOFFICE_OPERATOR", "CATALOG_MANAGER", "STORE_ADMIN", "SUPER_ADMIN"]>;
export declare const RegisterRequestSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
    fullName: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
    fullName: string;
}, {
    email: string;
    password: string;
    fullName: string;
}>;
export declare const LoginRequestSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
}, {
    email: string;
    password: string;
}>;
export declare const RefreshRequestSchema: z.ZodObject<{
    refreshToken: z.ZodString;
}, "strip", z.ZodTypeAny, {
    refreshToken: string;
}, {
    refreshToken: string;
}>;
export declare const AuthTokensSchema: z.ZodObject<{
    accessToken: z.ZodString;
    refreshToken: z.ZodString;
}, "strip", z.ZodTypeAny, {
    refreshToken: string;
    accessToken: string;
}, {
    refreshToken: string;
    accessToken: string;
}>;
export declare const AuthUserSchema: z.ZodObject<{
    id: z.ZodString;
    email: z.ZodString;
    role: z.ZodEnum<["USER", "BACKOFFICE_OPERATOR", "CATALOG_MANAGER", "STORE_ADMIN", "SUPER_ADMIN"]>;
}, "strip", z.ZodTypeAny, {
    email: string;
    id: string;
    role: "USER" | "BACKOFFICE_OPERATOR" | "CATALOG_MANAGER" | "STORE_ADMIN" | "SUPER_ADMIN";
}, {
    email: string;
    id: string;
    role: "USER" | "BACKOFFICE_OPERATOR" | "CATALOG_MANAGER" | "STORE_ADMIN" | "SUPER_ADMIN";
}>;
