// packages/types/src/guards.ts
export const isObj = (x) => !!x && typeof x === "object";
export const isTrade = (x) => isObj(x) &&
    typeof x.id === "string" &&
    typeof x.symbol === "string" &&
    typeof x.price === "number" &&
    typeof x.qty === "number";
export const isStrategy = (x) => isObj(x) &&
    typeof x.id === "string" &&
    typeof x.name === "string" &&
    typeof x.createdAt === "number" &&
    typeof x.updatedAt === "number";
export const isDraft = (x) => isObj(x) &&
    typeof x.name === "string" &&
    typeof x.symbol === "string" &&
    isObj(x.params);
export const isRole = (x) => isObj(x) &&
    typeof x.id === "string" &&
    typeof x.name === "string" &&
    Array.isArray(x.permissions);
