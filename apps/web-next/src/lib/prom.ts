export function scrapeVal(text: string, name: string): number | null {
  try{
    const re = new RegExp(`^${name}\\s+([0-9.]+)\\s*$`, 'm');
    const m = text.match(re);
    return m ? Number(m[1]) : null;
  }catch{ return null; }
}


