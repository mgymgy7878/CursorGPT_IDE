// Geçici wildcard bridge: derlemeyi bloklamasın.
// Hedef: Deep import varsa hepsi topluca @spark/types köküne düşsün.
declare module "@spark/types/*" {
  export * from "@spark/types";
}