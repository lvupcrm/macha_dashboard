import { Client } from '@notionhq/client';

const notion = new Client({ auth: (process.env.NOTION_TOKEN || '').trim() });

const DB_IDS = {
  mentions: '2bd08b1c348f8023bf04fa37fc57d0b6',
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { campaignId } = req.query;

    const queryOptions = {
      database_id: DB_IDS.mentions,
      page_size: 100,
    };

    // 캠페인 ID로 필터링 (실제 속성명: '캠페인 DB')
    if (campaignId) {
      queryOptions.filter = {
        property: '캠페인 DB',
        relation: { contains: campaignId },
      };
    }

    const response = await notion.databases.query(queryOptions);

    const mentions = response.results.map((page) => {
      const props = page.properties;

      // 썸네일 URL 추출
      const thumbnailFile = props['displayUrl']?.files?.[0];
      const thumbnail = thumbnailFile?.external?.url || thumbnailFile?.file?.url || '';

      return {
        id: page.id,
        influencerName: props['ownerFulName']?.rich_text?.[0]?.plain_text || props['ownerUsername']?.rich_text?.[0]?.plain_text || '',
        handle: props['ownerUsername']?.rich_text?.[0]?.plain_text || '',
        platform: 'instagram',
        type: props['type']?.select?.name?.toLowerCase() || 'post',
        likes: props['likesCounts']?.number || 0,
        comments: props['commentsCount']?.number || 0,
        shares: props['reshareCount']?.number || 0,
        views: props['VideoPlayCount']?.number || 0,
        reach: 0,
        impressions: 0,
        engagementRate: 0,
        postUrl: props['Post URL']?.url || '',
        postedAt: props['피드게시일']?.date?.start || '',
        caption: props['caption']?.rich_text?.[0]?.plain_text || '',
        thumbnail,
      };
    });

    res.status(200).json(mentions);
  } catch (error) {
    console.error('멘션 조회 에러:', error);
    res.status(500).json({
      error: '멘션 데이터를 불러오는데 실패했습니다.',
      details: error.message
    });
  }
}
