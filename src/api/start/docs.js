import request from '../request';


export function fetchKnowledgeList(language) {
  return request({
    url: `/user/knowledge/fetch?language=${language}`,
    method: 'get'
  }).then(response => {
    if (typeof response === 'object') {
      return response;
    }
    
    throw new Error('Invalid response format');
  }).catch(error => {
    throw error;
  });
}


export function fetchKnowledgeDetail(id, language) {
  return request({
    url: `/user/knowledge/fetch?id=${id}&language=${language}`,
    method: 'get'
  }).then(response => {
    if (typeof response === 'object') {
      return response;
    }
    
    throw new Error('Invalid response format');
  }).catch(error => {
    throw error;
  });
}

