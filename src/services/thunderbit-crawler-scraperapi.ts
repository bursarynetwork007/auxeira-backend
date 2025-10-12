// ScraperAPI adapter for Thunderbit crawler
export class ThunderbitCrawler {
  private apiKey: string;
  
  constructor() {
    this.apiKey = process.env.THUNDERBIT_API_KEY || '';
  }
  
  private async crawlUrl(url: string, selectors?: any): Promise<any> {
    // Use ScraperAPI proxy
    const scraperUrl = `http://api.scraperapi.com?api_key=${this.apiKey}&url=${encodeURIComponent(url)}&render=true`;
    
    const response = await fetch(scraperUrl);
    const html = await response.text();
    
    // Parse with cheerio or similar
    return { html, url, scrapedAt: new Date() };
  }
  
  // ... rest of methods same as Thunderbit
}
