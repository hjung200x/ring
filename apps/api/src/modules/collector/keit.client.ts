const BASE_URL = "https://srome.keit.re.kr";
const PROGRAM_ID = "XPG201040000";
const USER_AGENT = "Mozilla/5.0";

export interface KeitAnnouncementStub {
  sourceAncmId: string;
  sourceBsnsYy: string;
  title: string;
  statusText: string | null;
  postedAt: string | null;
  applyPeriodText: string | null;
  detailUrl: string;
}

export interface KeitAttachmentStub {
  filename: string;
  atchDocId: string;
  atchFileId: string;
}

export interface KeitAnnouncementDetail {
  title: string;
  statusText: string | null;
  postedAt: string | null;
  applyStartAt: Date | null;
  applyEndAt: Date | null;
  detailUrl: string;
  rawHtml: string;
  attachments: KeitAttachmentStub[];
}

const cleanText = (value: string) =>
  value.replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();

const parseApplyPeriod = (value: string | null): { start: Date | null; end: Date | null } => {
  if (!value) {
    return { start: null, end: null };
  }
  const match = value.match(/(\d{4}-\d{2}-\d{2} \d{2}:\d{2})\s*~\s*(\d{4}-\d{2}-\d{2} \d{2}:\d{2})/);
  if (!match) {
    return { start: null, end: null };
  }
  return {
    start: new Date(match[1].replace(" ", "T")),
    end: new Date(match[2].replace(" ", "T")),
  };
};

const listUrl = (pageIndex: number) =>
  `${BASE_URL}/srome/biz/perform/opnnPrpsl/retrieveTaskAnncmListView.do?pageIndex=${pageIndex}&ancmId=&bsnsYy=&prgmId=${PROGRAM_ID}&srchGubun=&srchKwd=&startDate=&endDate=&rcveStatus=all`;

const detailUrl = (sourceAncmId: string, sourceBsnsYy: string) =>
  `${BASE_URL}/srome/biz/perform/opnnPrpsl/retrieveTaskAnncmInfoView.do?ancmId=${encodeURIComponent(sourceAncmId)}&bsnsYy=${encodeURIComponent(sourceBsnsYy)}&prgmId=${PROGRAM_ID}&pageIndex=1`;

export class KeitClient {
  private async fetchText(url: string): Promise<string> {
    const response = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
    if (!response.ok) {
      throw new Error(`KEIT request failed: ${response.status} ${url}`);
    }
    return await response.text();
  }

  async fetchListPage(pageIndex: number): Promise<KeitAnnouncementStub[]> {
    const html = await this.fetchText(listUrl(pageIndex));
    const pattern = /f_detail\('([^']+)',\s*'([^']+)'\); return false;"[\s\S]*?<span class="title">([\s\S]*?)<\/span>[\s\S]*?<span class="label">접수기간<\/span>\s*<span class="value">([\s\S]*?)<\/span>[\s\S]*?<span class="label">등록일<\/span>\s*<span class="value">([\s\S]*?)<\/span>/g;
    const items: KeitAnnouncementStub[] = [];
    for (const match of html.matchAll(pattern)) {
      const prefix = html.slice(Math.max(0, match.index! - 120), match.index);
      const badgeMatch = prefix.match(/badge[^>]*">([^<]+)<\/span>/);
      items.push({
        sourceAncmId: match[1],
        sourceBsnsYy: match[2],
        title: cleanText(match[3]),
        statusText: badgeMatch ? cleanText(badgeMatch[1]) : null,
        applyPeriodText: cleanText(match[4]),
        postedAt: cleanText(match[5]) || null,
        detailUrl: detailUrl(match[1], match[2]),
      });
    }
    return items;
  }

  async fetchDetail(sourceAncmId: string, sourceBsnsYy: string): Promise<KeitAnnouncementDetail> {
    const url = detailUrl(sourceAncmId, sourceBsnsYy);
    const html = await this.fetchText(url);
    const titleMatch = html.match(/id="bsnsAncmTl"[^>]*value="([^"]+)"/i);
    const periodMatch = html.match(/<span class="label">접수기간<\/span>\s*<span class="val">([\s\S]*?)<\/span>/i);
    const postedMatch = html.match(/<span class="label">등록일<\/span>\s*<span class="val">([\s\S]*?)<\/span>/i);
    const badgeMatch = html.match(/badge[^>]*">([^<]+)<\/span>/i);
    const attachments: KeitAttachmentStub[] = [];
    const attachmentPattern = /f_itechFileDownload\('([^']+)',\s*'([^']+)'\)[\s\S]*?<span>([\s\S]*?)<\/span>/g;
    for (const match of html.matchAll(attachmentPattern)) {
      attachments.push({
        atchDocId: match[1],
        atchFileId: match[2],
        filename: cleanText(match[3]),
      });
    }
    const periodText = periodMatch ? cleanText(periodMatch[1]) : null;
    const period = parseApplyPeriod(periodText);

    return {
      title: cleanText(titleMatch?.[1] ?? ""),
      statusText: badgeMatch ? cleanText(badgeMatch[1]) : null,
      postedAt: postedMatch ? cleanText(postedMatch[1]) : null,
      applyStartAt: period.start,
      applyEndAt: period.end,
      detailUrl: url,
      rawHtml: html,
      attachments,
    };
  }

  async downloadAttachment(atchDocId: string, atchFileId: string): Promise<Buffer> {
    const url = `${BASE_URL}/srome/biz/common/file/downloadAtchItechFile.do?atchDocId=${encodeURIComponent(atchDocId)}&atchFileId=${encodeURIComponent(atchFileId)}`;
    const response = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
    if (!response.ok) {
      throw new Error(`KEIT attachment download failed: ${response.status}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }
}