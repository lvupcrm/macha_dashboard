import { Client } from '@notionhq/client';

const notion = new Client({ auth: (process.env.NOTION_TOKEN || '').trim() });

const DB_IDS = {
  campaigns: '2b708b1c-348f-8141-999f-f77b91095543',
};

export default async function handler(req, res) {
  // CORS 헤더
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const response = await notion.databases.query({
      database_id: DB_IDS.campaigns,
      filter: {
        property: '캠페인명',
        title: {
          equals: '스웻이프',
        },
      },
    });

    const campaigns = response.results.map((page) => {
      const props = page.properties;

      // 협찬 제품 목록 추출
      const products = props['협찬 제품']?.multi_select?.map(p => p.name) || [];

      return {
        id: page.id,
        name: props['캠페인명']?.title?.[0]?.plain_text || '',
        category: props['카테고리']?.select?.name || '',
        campaignType: props['캠페인 유형']?.select?.name || '협찬',
        productType: products.join(', '),
        participants: props['캠페인 총 참여 인원']?.rollup?.number || 0,
        startDate: props['캠페인 시작일']?.date?.start || '',
        endDate: props['캠페인 종료일']?.date?.start || '',
        manager: props['담당자']?.people?.[0]?.name || '',
        status: props['상태']?.status?.name || 'active',
        budget: props['예산(만원)']?.number || 0,
        spent: 0,
        // 성과 데이터
        totalLikes: 0,
        totalComments: 0,
        totalShares: 0,
        totalViews: 0,
        totalMentions: props['총 맨션 피드 수']?.formula?.number || 0,
      };
    });

    res.status(200).json(campaigns);
  } catch (error) {
    console.error('캠페인 목록 조회 에러:', error);
    res.status(500).json({
      error: '캠페인 목록을 불러오는데 실패했습니다.',
      details: error.message
    });
  }
}
