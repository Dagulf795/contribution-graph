import drawContributionGraph from "github-contribution-graph";

// src/services/utils.ts

export const manipulateJson = (data: number[][]): Record<string, { done: number; not_done: number; date: string }[]> => {
    const dates = data.map(item => new Date(item[0]));
  
    const formatDate = (date: Date): string => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };
  
    const dateSummary = dates.reduce<Record<string, number>>((summary, date) => {
      const formattedDate = formatDate(date);
      let count = (summary[formattedDate] ?? 0) + 1;
    
      if (count > 50) {
        count = 50;
      } else if (count >= 1 && count <= 11) {
        count = 11;
      } else if (count === 40) {
        count = 41;
      }
    
      summary[formattedDate] = count;
      return summary;
    }, {});
  
    console.log(`raw create dates: ${JSON.stringify(dateSummary)}`);
  
    const transformArray = (inputObject: Record<string, number>): Record<string, { done: number; not_done: number; date: string }[]> => {
      const transformedData: Record<string, { done: number; not_done: number; date: string }[]> = {};
  
      for (const dateKey in inputObject) {
        const done = inputObject[dateKey];
        const year = dateKey.split('-')[0];
  
        if (!transformedData[year]) {
          transformedData[year] = [];
        }
  
        transformedData[year].push({
          done: done,
          not_done: 0,
          date: dateKey
        });
      }
  
      return transformedData;
    };
  
    return transformArray(dateSummary);
  };
  
  export const generateContributionGraphSVG = async (manipulatedData: Record<string, { done: number; not_done: number; date: string }[]>): Promise<string> => {
    const svg = drawContributionGraph({
      data: manipulatedData,
      ssr: true, // Enable server-side rendering
    });
    return svg;
  };
  
  export const splitSVGs = (svgString: string): string[] => {
    const svgArray: string[] = [];
    const regex = /<svg[^>]*>[\s\S]*?<\/svg>/g;
    let match;
    while ((match = regex.exec(svgString)) !== null) {
      svgArray.push(match[0]);
    }
    return svgArray;
  };
  
  export const combineSVGs = (svgArray: string[]): string => {
    let combinedSVG = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 723 ${113 * svgArray.length}" width="723" height="${113 * svgArray.length}">`;
  
    svgArray.forEach((svg, index) => {
      combinedSVG += `<g transform="translate(0, ${index * 113})">${svg}</g>`;
    });
  
    combinedSVG += '</svg>';
  
    return combinedSVG;
  };
  