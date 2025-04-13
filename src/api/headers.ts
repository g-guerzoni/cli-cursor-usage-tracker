export function extractHeadersFromCurl(curlCommand: string): Record<string, string> | undefined {
  try {
    const headers: Record<string, string> = {};

    const cleanedCommand = curlCommand
      .replace(/\n/g, " ")
      .replace(/\r/g, " ")
      .replace(/\t/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    try {
      const headerPattern =
        /-H\s+['"]([^'"]+)['"]|-H\s+'([^']+)'|-H\s+"([^"]+)"|-H\s+([^\s'"]+)|--header\s+['"]([^'"]+)['"]|--header\s+'([^']+)'|--header\s+"([^"]+)"|--header\s+([^\s'"]+)/g;
      const headerMatches = cleanedCommand.match(headerPattern) || [];

      for (const headerMatch of headerMatches) {
        const contentMatch = headerMatch.match(/['"]([^'"]+)['"]|'([^']+)'|"([^"]+)"|[\s]([^\s'"]+)$/);
        if (contentMatch) {
          const headerContent = contentMatch[1] || contentMatch[2] || contentMatch[3] || contentMatch[4];
          const colonIndex = headerContent.indexOf(":");

          if (colonIndex > 0) {
            const name = headerContent.substring(0, colonIndex).trim();
            const value = headerContent.substring(colonIndex + 1).trim();
            headers[name] = value;
          }
        }
      }

      const cookiePattern =
        /-b\s+['"]([^'"]+)['"]|-b\s+'([^']+)'|-b\s+"([^"]+)"|-b\s+([^\s'"]+)|--cookie\s+['"]([^'"]+)['"]|--cookie\s+'([^']+)'|--cookie\s+"([^"]+)"|--cookie\s+([^\s'"]+)/g;
      const cookieMatches = cleanedCommand.match(cookiePattern) || [];

      for (const cookieMatch of cookieMatches) {
        const contentMatch = cookieMatch.match(/['"]([^'"]+)['"]|'([^']+)'|"([^"]+)"|[\s]([^\s'"]+)$/);
        if (contentMatch) {
          const cookieContent = contentMatch[1] || contentMatch[2] || contentMatch[3] || contentMatch[4];
          headers["Cookie"] = cookieContent;
          break;
        }
      }
    } catch (regexError) {
      console.error("Error in regex header extraction:", regexError);
    }

    if (!headers["Cookie"] && cleanedCommand.includes("WorkosCursorSessionToken=")) {
      const tokenPos = cleanedCommand.indexOf("WorkosCursorSessionToken=");
      if (tokenPos >= 0) {
        let cookieStart = cleanedCommand.lastIndexOf("'", tokenPos);
        if (cookieStart === -1) cookieStart = cleanedCommand.lastIndexOf('"', tokenPos);

        let cookieEnd = cleanedCommand.indexOf("'", tokenPos);
        if (cookieEnd === -1) cookieEnd = cleanedCommand.indexOf('"', tokenPos);

        if (cookieStart !== -1 && cookieEnd !== -1 && cookieEnd > cookieStart) {
          const cookieValue = cleanedCommand.substring(cookieStart + 1, cookieEnd);
          if (cookieValue.includes("WorkosCursorSessionToken=")) {
            headers["Cookie"] = cookieValue;
          }
        } else {
          const tokenRegex = /(WorkosCursorSessionToken=[^;'"&\s]+)/;
          const tokenMatch = cleanedCommand.match(tokenRegex);
          if (tokenMatch && tokenMatch[1]) {
            headers["Cookie"] = tokenMatch[1];
          } else {
            let tokenValue = cleanedCommand.substring(tokenPos);
            tokenValue = tokenValue.split(/['"\s]/)[0];
            headers["Cookie"] = tokenValue;
          }
        }
      }
    }

    return Object.keys(headers).length > 0 ? headers : undefined;
  } catch (error) {
    console.error("Error extracting headers from curl command:", error);
    return undefined;
  }
}
