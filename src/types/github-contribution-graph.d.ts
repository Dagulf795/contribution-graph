declare module 'github-contribution-graph' {
    interface TransformedItem {
        done: number;
        not_done: number;
        date: string;
      }
      
      interface TransformedData {
        [year: string]: TransformedItem[];
      }
  
    interface DrawContributionGraphConfig {
      graphWidth?: number;
      graphHeight?: number;
      graphMountElement?: string;
      graphTheme?: string;
    }
  
    function drawContributionGraph(
        options: {
          data: TransformedData;
          ssr?: boolean;
        } & DrawContributionGraphConfig
      ): string;
  
    export default drawContributionGraph;
  }