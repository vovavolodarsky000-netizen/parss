import * as cheerio from 'cheerio';
import logger from './logger.js';
import { ParsingError } from '../utils/errors.js';

export interface WebArticle {
  title: string;
  content: string;
  url: string;
  imageUrl?: string;
  author?: string;
  date?: Date;
}

export interface ParseRule {
  urlPattern: string;
  titleSelector: string;
  contentSelector: string;
  dateSelector?: string;
  imageSelector?: string;
  authorSelector?: string;
  linkSelector?: string;
  maxItems: number;
}

/**
 * Сервис для парсинга веб-сайтов
 */
class WebParserService {
  /**
   * Парсинг страницы по URL с использованием правил
   */
  async parsePage(url: string, rules: ParseRule[]): Promise<WebArticle[]> {
    try {
      // Получаем HTML страницы
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; TGParser/1.0)',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
      });

      if (!response.ok) {
        throw new ParsingError(`HTTP ${response.status}: ${response.statusText}`);
      }

      const html = await response.text();
      const $ = cheerio.load(html);

      const articles: WebArticle[] = [];

      for (const rule of rules) {
        if (!rule.urlPattern || !this.matchUrlPattern(url, rule.urlPattern)) {
          continue;
        }

      // Получаем ссылки на статьи
      const links: cheerio.Element[] = rule.linkSelector
        ? $(rule.linkSelector).toArray().slice(0, rule.maxItems)
        : [$('body')[0]].filter(Boolean);
        for (const link of links) {
          try {
            const article = await this.extractArticle($, link, rule, url);
            if (article) {
              articles.push(article);
            }
          } catch (error) {
            logger.warn('Ошибка извлечения статьи', { url, error });
          }
        }

        if (articles.length >= rule.maxItems) break;
      }

      logger.info('Страница успешно спарсена', { url, articlesCount: articles.length });
      return articles;
    } catch (error: any) {
      logger.error('Ошибка парсинга страницы', { url, error: error.message });
      throw new ParsingError(`Не удалось спарсить страницу ${url}: ${error.message}`);
    }
  }

  /**
   * Извлечение статьи из элемента
   */
  private async extractArticle(
    $: cheerio.CheerioAPI,
    element: cheerio.Element,
    rule: ParseRule,
    baseUrl: string
  ): Promise<WebArticle | null> {
    const title = $(element).find(rule.titleSelector).first().text().trim();
    const content = $(element).find(rule.contentSelector).first().text().trim();

    if (!title || !content) {
      return null;
    }

    const imageUrl = rule.imageSelector
      ? $(element).find(rule.imageSelector).first().attr('src')
      : undefined;

    const author = rule.authorSelector
      ? $(element).find(rule.authorSelector).first().text().trim()
      : undefined;

    let date: Date | undefined;
    if (rule.dateSelector) {
      const dateText = $(element).find(rule.dateSelector).first().text().trim();
      if (dateText) {
        date = new Date(dateText);
      }
    }

    const link = $(element).find('a').first().attr('href');
    const articleUrl = link ? this.resolveUrl(link, baseUrl) : baseUrl;

    return {
      title,
      content,
      url: articleUrl,
      imageUrl: imageUrl ? this.resolveUrl(imageUrl, baseUrl) : undefined,
      author: author || undefined,
      date: date || new Date(),
    };
  }

  /**
   * Проверка соответствия URL паттерну
   */
  private matchUrlPattern(url: string, pattern: string): boolean {
    try {
      const urlObj = new URL(url);
      const path = urlObj.pathname;

      // Преобразуем паттерн в регулярное выражение
      const regexPattern = pattern
        .replace(/\*/g, '.*')
        .replace(/\?/g, '.');

      const regex = new RegExp(`^${regexPattern}$`);
      return regex.test(path);
    } catch {
      return false;
    }
  }

  /**
   * Преобразование относительного URL в абсолютный
   */
  private resolveUrl(url: string, baseUrl: string): string {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }

    if (url.startsWith('//')) {
      const base = new URL(baseUrl);
      return `${base.protocol}${url}`;
    }

    if (url.startsWith('/')) {
      const base = new URL(baseUrl);
      return `${base.origin}${url}`;
    }

    return new URL(url, baseUrl).toString();
  }

  /**
   * Парсинг нескольких страниц сайта
   */
  async parseSite(baseUrl: string, rules: ParseRule[]): Promise<WebArticle[]> {
    const allArticles: WebArticle[] = [];

    for (const rule of rules) {
      try {
        const pageUrl = new URL(rule.urlPattern, baseUrl).toString();
        const articles = await this.parsePage(pageUrl, [rule]);
        allArticles.push(...articles);
      } catch (error) {
        logger.warn('Ошибка парсинга страницы сайта', { baseUrl, error });
      }
    }

    return allArticles;
  }
}

export const webParserService = new WebParserService();
export default webParserService;
