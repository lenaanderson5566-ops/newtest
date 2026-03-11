import request from './request';

const extractNoticeList = (response) => {
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.data?.data)) return response.data.data;
  return [];
};

// 当前后端仅提供 /user/notice/fetch（公告列表），未提供已读字段
// 这里以公告总数作为红点计数来源，避免依赖不存在字段
export async function getUnreadNoticeCount() {
  const response = await request({
    url: '/user/notice/fetch',
    method: 'get'
  });

  const notices = extractNoticeList(response);
  const unreadCount = notices.length;

  return {
    ...response,
    data: {
      ...((response?.data && typeof response.data === 'object' && !Array.isArray(response.data)) ? response.data : {}),
      count: unreadCount,
      unreadCount
    }
  };
}
