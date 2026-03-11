import request from './request';

const extractNoticeList = (response) => {
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.data?.data)) return response.data.data;
  return [];
};

const isNoticeUnread = (notice = {}) => {
  if (typeof notice.is_read !== 'undefined') return !Boolean(notice.is_read);
  if (typeof notice.read !== 'undefined') return !Boolean(notice.read);
  if (typeof notice.has_read !== 'undefined') return !Boolean(notice.has_read);
  if (typeof notice.read_at !== 'undefined') return !notice.read_at;
  return false;
};

// 当前后端可用接口为 /user/notice/fetch，这里兼容计算未读数
export async function getUnreadNoticeCount() {
  const response = await request({
    url: '/user/notice/fetch',
    method: 'get'
  });

  const notices = extractNoticeList(response);
  const unreadCount = notices.reduce((count, notice) => {
    return count + (isNoticeUnread(notice) ? 1 : 0);
  }, 0);

  return {
    ...response,
    data: {
      ...((response?.data && typeof response.data === 'object' && !Array.isArray(response.data)) ? response.data : {}),
      count: unreadCount,
      unreadCount
    }
  };
}
