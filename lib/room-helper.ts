export function validateAndParseRoomPattern(patternStr: string): { isValid: boolean; error?: string; rooms: string[] } {
  if (!patternStr.trim()) {
    return { isValid: true, rooms: [] };
  }

  const parts = patternStr.split(',').map(p => p.trim()).filter(Boolean);
  const rooms: string[] = [];

  for (const part of parts) {
    if (part.includes('-')) {
      const rangeMatch = part.match(/^([a-zA-Z]*)([0-9]+)-([a-zA-Z]*)([0-9]+)$/);
      if (!rangeMatch) {
        return {
          isValid: false,
          error: `Format rentang "${part}" tidak valid. Gunakan format seperti "a1-a6" atau "1-10".`,
          rooms: []
        };
      }

      const prefixStart = rangeMatch[1];
      const startNum = parseInt(rangeMatch[2], 10);
      const prefixEnd = rangeMatch[3];
      const endNum = parseInt(rangeMatch[4], 10);

      // VALIDASI: Prefiks harus sama persis (kasus a1-b8 akan ditolak di sini)
      if (prefixStart !== prefixEnd) {
        return {
          isValid: false,
          error: `Prefiks awal dan akhir pada "${part}" tidak sama ("${prefixStart}" vs "${prefixEnd}"). Harap gunakan prefiks yang sama (misal: "a1-a6").`,
          rooms: []
        };
      }

      // VALIDASI: Angka awal <= Angka akhir
      if (startNum > endNum) {
        return {
          isValid: false,
          error: `Nomor awal pada "${part}" tidak boleh lebih besar dari nomor akhir ("${startNum}" > "${endNum}").`,
          rooms: []
        };
      }

      // VALIDASI: Batasi ukuran rentang (maksimal 100 kamar per rentang)
      if (endNum - startNum > 100) {
        return {
          isValid: false,
          error: `Rentang "${part}" terlalu besar (maksimal 100 kamar per pola rentang).`,
          rooms: []
        };
      }

      // Generate nomor kamar
      for (let i = startNum; i <= endNum; i++) {
        rooms.push(`${prefixStart}${i}`);
      }
    } else {
      // Kamar tunggal, periksa karakter ilegal
      if (!/^[a-zA-Z0-9_-]+$/.test(part)) {
        return {
          isValid: false,
          error: `Nomor kamar "${part}" mengandung karakter tidak sah. Hanya diperbolehkan huruf, angka, tanda hubung (-), dan underscore (_).`,
          rooms: []
        };
      }
      rooms.push(part);
    }
  }

  // VALIDASI: Cek duplikasi nomor kamar
  const uniqueRooms = new Set(rooms);
  if (uniqueRooms.size !== rooms.length) {
    const duplicates = rooms.filter((item, index) => rooms.indexOf(item) !== index);
    return {
      isValid: false,
      error: `Terdapat nomor kamar duplikat: ${Array.from(new Set(duplicates)).join(', ')}.`,
      rooms: []
    };
  }

  // VALIDASI: Batasi total kamar keseluruhan
  if (rooms.length > 500) {
    return {
      isValid: false,
      error: `Total kamar (${rooms.length}) melebihi batas maksimal (500 kamar).`,
      rooms: []
    };
  }

  return { isValid: true, rooms };
}

export function generateDefaultRooms(totalRooms: number): string[] {
  const rooms: string[] = [];
  for (let i = 1; i <= totalRooms; i++) {
    rooms.push(i.toString().padStart(2, '0'));
  }
  return rooms;
}
