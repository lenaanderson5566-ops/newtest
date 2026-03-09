import request from './request';

// 预留公告未读数接口，后续可替换为真实后端路径
export function getUnreadNoticeCount() {
  return request({
    url: '/user/notice/unread-count',
    method: 'get'
  });
}
