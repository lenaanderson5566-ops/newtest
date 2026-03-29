<template>
  <div class="account-container page-shell">
    <!-- 自定义确认弹窗 -->
    <transition name="modal">
      <div class="custom-modal" v-if="showConfirmModal">
        <div class="modal-overlay" @click="cancelConfirmation"></div>
        <div class="modal-container">
          <div class="modal-header">
            <h3>{{ $t('invite.confirm.title') }}</h3>
            <button class="modal-close" @click="cancelConfirmation">
              <IconX />
            </button>
          </div>
          <div class="modal-body">
            <p>{{ confirmModalMessage }}</p>
          </div>
          <div class="modal-footer">
            <button class="btn-outline cancel-btn" @click="cancelConfirmation">
              {{ $t('invite.confirm.cancel') }}
            </button>
            <button class="btn-primary confirm-btn" @click="confirmAction">
              {{ $t('invite.confirm.confirm') }}
            </button>
          </div>
        </div>
      </div>
    </transition>
    
    <div class="account-inner page-inner page-stack">
      <button class="account-back-btn" @click="goBackToAccount">
        <IconChevronLeft :size="20" />
      </button>

      <!-- 佣金余额卡片 -->
      <div class="dashboard-card balance-card">
        <div class="card-header">
          <h2 class="card-title">{{ $t('invite.balance.title') }}</h2>
        </div>
        <div v-if="loading.inviteData" class="card-body skeleton-loading">
          <div class="skeleton-row"></div>
          <div class="skeleton-row"></div>
        </div>
        <div v-else class="card-body">
          <div class="balance-container">
            <div class="balance-info">
              <div class="balance-label">{{ $t('invite.balance.available') }}</div>
              <div class="balance-value">{{ currencySymbol }}{{ inviteStats.availableCommission }}</div>
              <div class="balance-description">{{ $t('invite.balance.description') }}</div>
            </div>
            <div class="balance-actions">
              <button class="btn-primary" @click="toggleTransferCard">
                <IconCash class="btn-icon" />
                {{ $t('invite.balance.transferToBalance') }}
              </button>
              <button v-if="withdrawClose === 0" class="btn-primary withdraw-btn" @click="toggleWithdrawCard">
                <IconReceipt class="btn-icon" />
                {{ $t('invite.balance.withdraw') }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="dashboard-card referral-kpi-card" v-if="!loading.inviteData">
        <div class="referral-kpi-grid">
          <div class="kpi-item">
            <div class="kpi-label">{{ $t('invite.stats.registeredUsers') }}</div>
            <div class="kpi-value">{{ inviteStats.registeredUsers }}</div>
          </div>
          <div class="kpi-item">
            <div class="kpi-label">{{ $t('invite.stats.commissionRate') }}</div>
            <div class="kpi-value">{{ inviteStats.commissionRate }}%</div>
          </div>
          <div class="kpi-item">
            <div class="kpi-label">{{ $t('invite.stats.pendingCommission') }}</div>
            <div class="kpi-value">{{ currencySymbol }}{{ inviteStats.pendingCommission }}</div>
          </div>
          <div class="kpi-item">
            <div class="kpi-label">{{ $t('invite.stats.availableCommission') }}</div>
            <div class="kpi-value">{{ currencySymbol }}{{ inviteStats.validCommission }}</div>
          </div>
        </div>
      </div>
      
      <!-- 划转到余额弹窗 -->
      <transition name="modal-fade">
        <div v-if="showTransferCardState" class="modal-overlay" @click="showTransferCardState = false">
          <div class="modal-content" @click.stop>
            <div class="modal-header">
              <h3>{{ $t('invite.transfer.title') }}</h3>
              <button class="modal-close" @click="showTransferCardState = false">
                <IconX :size="20" />
              </button>
            </div>
            <div class="modal-body">
              <div class="alert alert-warning">
                <IconAlertTriangle :size="22" class="alert-icon" />
                <div class="alert-content">
                  <div class="alert-title">{{ $t('invite.transfer.warning') }}</div>
                  <div class="alert-desc">{{ $t('invite.transfer.warningDesc') }}</div>
                </div>
              </div>
              
              <div class="transfer-form">
                <div class="form-group">
                  <label class="form-label">{{ $t('invite.transfer.amount') }}</label>
                  <div class="input-with-prefix">
                    <div class="input-prefix">{{ currencySymbol }}</div>
                    <input 
                      type="number" 
                      v-model="transferAmount" 
                      class="form-control" 
                      :placeholder="$t('invite.transfer.amountPlaceholder')"
                      min="0"
                      :max="inviteStats.availableCommission"
                      step="0.01"
                    />
                  </div>
                  <div class="form-hint">
                    {{ $t('invite.transfer.availableCommission') }}: {{ currencySymbol }}{{ inviteStats.availableCommission }}
                  </div>
                  <div v-if="transferError" class="error-message">{{ transferError }}</div>
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn-cancel" @click="showTransferCardState = false">
                {{ $t('common.cancel') }}
              </button>
              <button 
                class="btn-submit" 
                @click="confirmTransfer"
                :disabled="isTransferDisabled || transferLoading"
              >
                <div v-if="transferLoading" class="loader"></div>
                <span v-else>{{ $t('invite.transfer.confirm') }}</span>
              </button>
            </div>
          </div>
        </div>
      </transition>
      
      <!-- 提现弹窗 -->
      <transition name="modal-fade">
        <div v-if="showWithdrawCard" class="modal-overlay" @click="closeWithdrawCard()">
          <div class="modal-content" @click.stop>
            <div class="modal-header">
              <h3>{{ $t('invite.withdraw.title') }}</h3>
              <button class="modal-close" @click="closeWithdrawCard()">
                <IconX :size="20" />
              </button>
            </div>
            <div class="modal-body">
              <div v-if="withdrawMethods.length === 0" class="alert alert-warning">
                <IconAlertTriangle :size="22" class="alert-icon" />
                <div class="alert-content">
                  <div class="alert-title">{{ $t('invite.withdraw.tip') }}</div>
                  <div class="alert-desc">{{ $t('invite.withdraw.noPlatforms') }}</div>
                </div>
              </div>
              
              <div v-else-if="parseFloat(inviteStats.availableCommission) <= 0" class="alert alert-warning">
                <IconAlertTriangle :size="22" class="alert-icon" />
                <div class="alert-content">
                  <div class="alert-title">{{ $t('invite.withdraw.tip') }}</div>
                  <div class="alert-desc">{{ $t('invite.withdraw.insufficientFunds') }}</div>
                </div>
              </div>
              
              <div v-else class="transfer-form">
                <div class="form-group">
                  <label class="form-label">{{ $t('invite.withdraw.platform') }}</label>
                  <div class="withdraw-methods">
                    <button
                      v-for="(method, index) in withdrawMethods"
                      :key="index"
                      class="withdraw-method"
                      :class="{ 'active': selectedWithdrawMethod === method }"
                      @click="selectWithdrawMethod(method)"
                    >
                      {{ method }}
                    </button>
                  </div>
                </div>
                
                <div class="form-group">
                  <label class="form-label">{{ $t('invite.withdraw.account') }}</label>
                  <div class="input-with-prefix account-input">
                    <input 
                      type="text" 
                      v-model="withdrawAccount" 
                      class="form-control" 
                      :placeholder="$t('invite.withdraw.accountPlaceholder')"
                    />
                  </div>
                </div>
                
                <div class="form-group">
                  <label class="form-label">{{ $t('invite.withdraw.amount') }}</label>
                  <div class="input-with-prefix">
                    <div class="input-prefix">{{ currencySymbol }}</div>
                    <input 
                      type="number" 
                      v-model="withdrawAmount" 
                      class="form-control" 
                      :placeholder="$t('invite.withdraw.amountPlaceholder')"
                      min="0"
                      :max="inviteStats.availableCommission"
                      step="0.01"
                    />
                  </div>
                  <div class="form-hint">
                    {{ $t('invite.withdraw.availableCommission') }}: {{ currencySymbol }}{{ inviteStats.availableCommission }}
                    <span v-if="minWithdrawAmount > 0" class="min-withdraw-hint">
                      ({{ $t('invite.withdraw.minWithdrawAmount') }}: {{ currencySymbol }}{{ minWithdrawAmount }})
                    </span>
                  </div>
                </div>
                
                <div v-if="withdrawError && withdrawError !== t('invite.withdraw.insufficientFunds')" class="error-message">{{ withdrawError }}</div>
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn-cancel" @click="closeWithdrawCard">
                {{ $t('common.cancel') }}
              </button>
              <button 
                class="btn-submit" 
                @click="submitWithdraw"
                :disabled="!withdrawAccount || !selectedWithdrawMethod || withdrawLoading || parseFloat(inviteStats.availableCommission) <= 0"
              >
                <div v-if="withdrawLoading" class="loader"></div>
                <span v-else>{{ $t('invite.withdraw.confirm') }}</span>
              </button>
            </div>
          </div>
        </div>
      </transition>
      
      <!-- 邀请链接卡片 -->
      <div class="dashboard-card">
        <div class="card-header">
          <h2 class="card-title">{{ $t('invite.inviteLink.title') }}</h2>
          <div class="card-actions">
            <button class="btn-action" @click="createInviteCode" :disabled="creatingCode">
              <div v-if="creatingCode" class="loading-icon"></div>
              <IconPlus v-else class="action-icon" />
              {{ creatingCode ? $t('invite.inviteLink.creating') : $t('invite.inviteLink.createCode') }}
            </button>
          </div>
        </div>
        <div v-if="loading.inviteData" class="card-body skeleton-loading">
          <div class="skeleton-row"></div>
          <div class="skeleton-row"></div>
        </div>
        <div v-else class="card-body">
          <template v-if="inviteCodes.length > 0">
            <div class="invite-codes-wrapper">
              <div class="invite-cards-container">
                <div class="invite-cards-nav prev" @click="prevInviteCode" v-if="inviteCodes.length > 1">
                  <IconChevronLeft />
                </div>
                
                <div class="invite-cards-wrapper">
                  <transition-group name="invite-card" tag="div" class="invite-cards">
                    <div 
                      v-for="(code, index) in inviteCodes" 
                      :key="code.id || 'invite-code-' + index" 
                      class="invite-card"
                      :class="{ 'active': selectedCodeIndex === index, 'prev': index < selectedCodeIndex, 'next': index > selectedCodeIndex }"
                      @click="selectedCodeIndex = index"
                    >
                      <div class="invite-card-inner">
                        <div class="card-shine"></div>
                        <div class="card-decoration"></div>
                        
                        <div class="invite-card-header">
                          <div class="invite-card-title">
                            <IconTicket class="card-icon" />
                            {{ $t('invite.inviteLink.inviteCode') }} {{ index + 1 }}
                          </div>
                        </div>
                        
                        <div class="invite-card-body">
                          <div class="invite-code-display">
                            <span v-for="(char, i) in code.code" :key="i" class="code-char">{{ char }}</span>
                          </div>
                        </div>
                        
                        <div class="invite-card-footer">
                          <div class="card-label">{{ $t('invite.inviteLink.scanDescription') }}</div>
                          <div class="invite-card-date">{{ $t('invite.inviteLink.createdAt', { date: formatCodeDate(code.created_at) }) }}</div>
                        </div>
                      </div>
                    </div>
                  </transition-group>
                </div>
                
                <div class="invite-cards-nav next" @click="nextInviteCode" v-if="inviteCodes.length > 1">
                  <IconChevronRight />
                </div>
              </div>
              
              <!-- 添加指示器 -->
              <div class="invite-cards-indicators" v-if="inviteCodes.length > 1">
                <span 
                  v-for="(code, index) in inviteCodes" 
                  :key="code.id"
                  class="indicator"
                  :class="{ 'active': selectedCodeIndex === index }"
                  @click="selectedCodeIndex = index"
                ></span>
              </div>
              
              <div class="invite-link-wrapper">
                <div class="input-with-icon">
                  <IconLink class="input-icon" />
                  <input 
                    type="text" 
                    class="invite-link" 
                    :value="inviteLink" 
                    readonly
                    :placeholder="$t('invite.inviteLink.placeholder')"
                  />
                </div>
                <button class="btn-primary" @click="copyInviteLink">
                  <IconCopy class="btn-icon" />
                  {{ $t('invite.inviteLink.copyLink') }}
                </button>
              </div>
            </div>
            
            <div class="share-buttons mt-3">
              <button class="btn-outline wechat-btn" @click="shareToWechat">
                <IconBrandWechat class="btn-icon" /> {{ $t('invite.share.wechat') }}
              </button>
              <button class="btn-outline qq-btn" @click="shareToQQ">
                <IconBrandQq class="btn-icon" /> {{ $t('invite.share.qq') }}
              </button>
              <button class="btn-outline twitter-btn" @click="shareToTwitter">
                <IconBrandTwitter class="btn-icon" /> {{ $t('invite.share.twitter') }}
              </button>
              <button class="btn-outline telegram-btn" @click="shareToTelegram">
                <IconBrandTelegram class="btn-icon" /> {{ $t('invite.share.telegram') }}
              </button>
            </div>
          </template>
          <div v-else class="no-invite-code">
            <p>{{ $t('invite.inviteLink.noInviteCode') }}</p>
            <button class="btn-primary create-code-btn" @click="createInviteCode" :disabled="creatingCode">
              <div v-if="creatingCode" class="loading-icon"></div>
              <span v-else class="create-btn-content">
                <IconPlus class="btn-icon" />
                {{ $t('invite.inviteLink.createCode') }}
              </span>
            </button>
          </div>
        </div>
      </div>
      
      <!-- 邀请记录卡片 -->
      <div class="dashboard-card">
        <div class="card-header">
          <h2 class="card-title">{{ $t('invite.records.title') }}</h2>
          <div class="card-actions">
            <button class="btn-action" @click="refreshRecords" :disabled="loading.inviteDetails">
              <IconRefresh class="action-icon" :class="{ 'spin': loading.inviteDetails }" />
              {{ loading.inviteDetails ? $t('invite.records.refreshing') : $t('invite.records.refresh') }}
            </button>
          </div>
        </div>
        <div v-if="loading.inviteDetails" class="card-body skeleton-loading">
          <div class="skeleton-table">
            <div class="skeleton-header-row">
              <div class="skeleton-header-cell"></div>
              <div class="skeleton-header-cell"></div>
              <div class="skeleton-header-cell"></div>
              <div class="skeleton-header-cell"></div>
            </div>
            <div v-for="i in 3" :key="i" class="skeleton-row-full">
              <div class="skeleton-cell"></div>
              <div class="skeleton-cell"></div>
              <div class="skeleton-cell"></div>
              <div class="skeleton-cell"></div>
            </div>
          </div>
        </div>
        <div v-else class="card-body">
          <div class="records-table-wrapper">
            <template v-if="inviteRecords.length > 0">
            <table class="records-table">
              <thead>
                <tr>
                  <th>{{ $t('invite.records.registerTime') }}</th>
                  <th>{{ $t('invite.records.amount') }}</th>
                  <th>{{ $t('invite.records.commission') }}</th>
                  <th>{{ $t('invite.records.status.title') }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="record in paginatedRecords" :key="record.id">
                    <td>{{ formatDate(record.created_at) }}</td>
                    <td>{{ currencySymbol }}{{ record.amount || '0.00' }}</td>
                    <td>{{ currencySymbol }}{{ record.commission_amount }}</td>
                    <td>
                      <span class="status-badge" :class="record.commission_status === 1 ? 'confirmed' : 'pending'">
                        {{ record.commission_status === 1 ? $t('invite.records.status.confirmed') : $t('invite.records.status.pending') }}
                      </span>
                    </td>
                </tr>
              </tbody>
            </table>
            
            <!-- 添加分页控件 -->
            <div class="pagination-controls" v-if="totalPages > 1">
              <button 
                class="page-btn prev-btn" 
                @click="handlePageChange(currentPage - 1)" 
                :disabled="currentPage === 1 || loading.inviteDetails"
              >
                <IconChevronLeft size="16" />
              </button>
              
              <div class="page-numbers">
                <!-- 第一页 - 仅在桌面端显示 -->
                <button 
                  v-if="totalPages > 4 && currentPage > 3 && !isMobile" 
                  class="page-btn" 
                  :class="{ active: currentPage === 1 }"
                  @click="handlePageChange(1)"
                  :disabled="loading.inviteDetails"
                >
                  1
                </button>
                
                <!-- 省略号 - 仅在桌面端显示 -->
                <span v-if="totalPages > 4 && currentPage > 3 && !isMobile" class="page-ellipsis">...</span>
                
                <!-- 页码按钮 -->
                <template v-for="page in displayPageNumbers" :key="'page-'+page">
                  <button 
                    class="page-btn"
                    :class="{ active: currentPage === page }"
                    @click="handlePageChange(page)"
                    :disabled="loading.inviteDetails"
                  >
                    {{ page }}
                  </button>
                </template>
                
                <!-- 省略号 - 仅在桌面端显示 -->
                <span v-if="totalPages > 4 && currentPage < totalPages - 2 && !isMobile" class="page-ellipsis">...</span>
                
                <!-- 最后一页 - 仅在桌面端显示 -->
                <button 
                  v-if="totalPages > 4 && currentPage < totalPages - 2 && !isMobile" 
                  class="page-btn" 
                  :class="{ active: currentPage === totalPages }"
                  @click="handlePageChange(totalPages)"
                  :disabled="loading.inviteDetails"
                >
                  {{ totalPages }}
                </button>
              </div>
              
              <button 
                class="page-btn next-btn" 
                @click="handlePageChange(currentPage + 1)" 
                :disabled="currentPage === totalPages || loading.inviteDetails"
              >
                <IconChevronRight size="16" />
              </button>
              
              <!-- 添加每页显示数量选择器 -->
              <div class="page-size-container">
                <div class="page-size-selector" @click="togglePageSizeDropdown" :class="{ disabled: loading.inviteDetails }">
                  <div class="select-value">{{ pageSize }}</div>
                  <div class="select-icon">
                    <IconChevronDown :class="{ 'rotate-180': showPageSizeDropdown }" />
                  </div>
                  
                  <transition name="fade">
                    <div class="select-dropdown" v-if="showPageSizeDropdown">
                      <div 
                        v-for="size in pageSizeOptions" 
                        :key="size"
                        class="select-option"
                        :class="{ selected: size === pageSize }"
                        @click.stop="selectPageSize(size)"
                      >
                        {{ size }}
                      </div>
                    </div>
                  </transition>
                </div>
              </div>
            </div>
            </template>
            <div v-else class="empty-records">
              <p>{{ $t('invite.records.noRecords') }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { useI18n } from 'vue-i18n';
import { ref, computed, onMounted, onUnmounted, reactive, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import { useToast } from '@/composables/useToast';
import { INVITE_CONFIG } from '@/utils/baseConfig';
import { getInviteData, getInviteDetails, getCommissionConfig, generateInviteCode, transferCommission, withdrawCommission } from '@/api/account/invite';
import {
  IconCopy,
  IconBrandWechat,
  IconBrandTwitter,
  IconBrandTelegram,
  IconCash,
  IconRefresh,
  IconPlus,
  IconBrandQq,
  IconLink,
  IconX,
  IconChevronLeft,
  IconChevronRight,
  IconChevronDown,
  IconTicket,
  IconAlertTriangle,
  IconReceipt,
} from '@tabler/icons-vue';

export default {
  name: 'InviteView',
  components: {
    IconCopy,
    IconBrandWechat,
    IconBrandTwitter,
    IconBrandTelegram,
    IconCash,
    IconRefresh,
    IconPlus,
    IconBrandQq,
    IconLink,
    IconX,
    IconChevronLeft,
    IconChevronRight,
    IconChevronDown,
    IconTicket,
    IconAlertTriangle,
    IconReceipt,
  },
  setup() {
    const { showToast } = useToast();
    const { t } = useI18n();
    const router = useRouter();
    
    const loading = reactive({
      inviteData: true,
      inviteDetails: true,
      commConfig: true
    });
    
    const creatingCode = ref(false);
    
    const currency = ref('CNY');
    const currencySymbol = ref('¥');
    
    const inviteCodes = ref([]);
    const selectedCodeIndex = ref(0);
    
    const inviteStats = reactive({
      registeredUsers: 0,
      validCommission: 0,
      pendingCommission: 0,
      commissionRate: 0,
      availableCommission: 0
    });
    
    const inviteRecords = ref([]);
    
    const currentPage = ref(1);
    const pageSize = ref(INVITE_CONFIG.recordsPerPage || 10);
    const totalRecords = ref(0);
    
    const pageSizeOptions = [10, 20, 50, 100, 200];
    const showPageSizeDropdown = ref(false);
    
    const togglePageSizeDropdown = () => {
      showPageSizeDropdown.value = !showPageSizeDropdown.value;
    };
    
    const selectPageSize = (size) => {
      if (pageSize.value !== size) {
        pageSize.value = size;
        currentPage.value = 1; 
        fetchInviteDetails(1); 
      }
      showPageSizeDropdown.value = false;
    };
    
    const closePageSizeDropdownOnClickOutside = (event) => {
      const dropdown = document.querySelector('.page-size-selector');
      if (dropdown && !dropdown.contains(event.target)) {
        showPageSizeDropdown.value = false;
      }
    };
    
    const paginatedRecords = computed(() => inviteRecords.value);
    
    const totalPages = computed(() => {
      return Math.ceil(totalRecords.value / pageSize.value);
    });
    
    const displayPageNumbers = computed(() => {
      const pages = [];
      const maxVisiblePages = isMobile.value ? 1 : 3; 
      
      if (totalPages.value <= maxVisiblePages) {
        for (let i = 1; i <= totalPages.value; i++) {
          pages.push(i);
        }
      } else {
        let startPage = Math.max(currentPage.value - Math.floor(maxVisiblePages / 2), 1);
        let endPage = startPage + maxVisiblePages - 1;
        
        if (endPage > totalPages.value) {
          endPage = totalPages.value;
          startPage = Math.max(endPage - maxVisiblePages + 1, 1);
        }
        
        for (let i = startPage; i <= endPage; i++) {
          pages.push(i);
        }
      }
      
      return pages;
    });
    
    const handlePageChange = (page) => {
      if (page < 1) {
        page = 1;
      } else if (page > totalPages.value) {
        page = totalPages.value;
      }
      
      if (page !== currentPage.value) {
        currentPage.value = page;
        fetchInviteDetails(page);
        
        nextTick(() => {
          const tableElement = document.querySelector('.records-table-wrapper');
          if (tableElement) {
            tableElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          }
        });
      }
    };
    
    const inviteLink = computed(() => {
      if (inviteCodes.value.length === 0 || selectedCodeIndex.value >= inviteCodes.value.length) {
        return '';
      }
      const code = inviteCodes.value[selectedCodeIndex.value].code;
      
      if (INVITE_CONFIG.inviteLinkConfig && INVITE_CONFIG.inviteLinkConfig.linkMode === 'custom') {
        const customDomain = INVITE_CONFIG.inviteLinkConfig.customDomain;
        const domain = customDomain.endsWith('/') ? customDomain.slice(0, -1) : customDomain;
        return `${domain}/#/register?code=${code}`;
      } else {
        return `${window.location.origin}/#/register?code=${code}`;
      }
    });
    
    const createInviteCode = async () => {
      if (creatingCode.value) return;
      
      creatingCode.value = true;
      
      try {
        const res = await generateInviteCode();
        
        if (res.data) {
          await fetchInviteData();
          handleSuccess(t('invite.inviteLink.created'));
        }
      } catch (error) {
        handleError(error);
      } finally {
        creatingCode.value = false;
      }
    };
    
    const copyInviteLink = () => {
      if (!inviteLink.value) return;
      
      navigator.clipboard.writeText(inviteLink.value)
        .then(() => {
          handleSuccess(t('invite.inviteLink.copied'));
        })
        .catch(() => {
          const textarea = document.createElement('textarea');
          textarea.value = inviteLink.value;
          textarea.style.position = 'fixed';
          document.body.appendChild(textarea);
          textarea.focus();
          textarea.select();
          
          try {
            const successful = document.execCommand('copy');
            if (successful) {
              handleSuccess(t('invite.inviteLink.copied'));
            } else {
              throw new Error('Copy failed');
            }
          } catch (err) {
            handleError({ message: t('common.copyFailed') });
          }
          
          document.body.removeChild(textarea);
        });
    };
    
    const showConfirmModal = ref(false);
    const confirmModalMessage = ref('');
    const pendingAction = ref(null);
    
    const confirmAction = () => {
      if (pendingAction.value) {
        pendingAction.value();
      }
      showConfirmModal.value = false;
    };
    
    const cancelConfirmation = () => {
      showConfirmModal.value = false;
      pendingAction.value = null;
    };
    
    const shareToWechat = () => {
      if (!inviteLink.value) {
        showToast(t('invite.share.noLinkAvailable'), 'error');
        return;
      }
      
      const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(inviteLink.value)}`;
      
      const win = window.open('', '_blank', 'width=600,height=400');
      win.document.write(`
        <html>
          <head>
            <title>${t('invite.share.scanTitle')}</title>
            <style lang="scss">
@use "@/assets/styles/base/variables.scss" as *;
              :root { --font-size-sm: 14px; --font-size-base: 16px; --font-size-lg: 20px; }
              body { font-family: Arial, sans-serif; text-align: center; padding: 20px; }
              img { max-width: 100%; height: auto; margin-bottom: 20px; }
              h2 { color: var(--text-primary); }
              p { color: var(--text-tertiary); }
            

/* Compact dashboard layout overrides for Billing / Referral */
.account-container {
  padding: 16px;

  .account-inner {
    max-width: 1160px;
  }

  .dashboard-card {
    padding: 22px;
    margin-bottom: 20px;

    .card-header {
      margin-bottom: 10px;
    }

    .card-title {
      font-size: $font-size-md;
      line-height: 1.25;
    }

    .card-body > p {
      margin: 0;
      line-height: 1.45;
    }
  }

  .stats-grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 16px;
    margin-bottom: 20px;

    .stats-card {
      min-height: 112px;
      padding: 20px;
      align-items: flex-start;
      gap: 12px;

      .stats-icon {
        width: 44px;
        height: 44px;
        margin-right: 0;
        border-radius: 10px;

        :deep(svg) {
          width: 20px;
          height: 20px;
        }
      }

      .stats-info {
        display: flex;
        flex-direction: column;
        gap: 6px;

        .stats-value {
          font-size: $font-size-xl;
          font-weight: $font-weight-bold;
          margin-bottom: 0;
          line-height: 1.05;
        }

        .stats-label {
          font-size: $font-size-sm;
          line-height: 1.35;
        }
      }
    }
  }

  .compact-stepper {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 12px;

    .rule-item {
      position: relative;
      border-radius: 12px;
      padding: 12px 12px 12px 44px;
      gap: 10px;
      min-height: 96px;

      .rule-step-index {
        position: absolute;
        left: 12px;
        top: 12px;
        font-size: $font-size-sm;
        font-weight: $font-weight-bold;
        color: rgba(var(--theme-color-rgb), 0.78);
      }

      .rule-icon {
        width: 36px;
        height: 36px;
        border-radius: 9px;

        :deep(svg) {
          width: 18px;
          height: 18px;
        }
      }

      .rule-content {
        h3 {
          font-size: $font-size-md;
          margin-bottom: 3px;
        }

        p {
          font-size: $font-size-sm;
          line-height: 1.35;
        }
      }
    }
  }

  .balance-container {
    display: grid;
    grid-template-columns: 1.8fr 1fr;
    gap: 16px;
    align-items: center;

    .balance-info {
      .balance-label {
        margin-bottom: 4px;
      }

      .balance-value {
        margin-bottom: 6px;
      }
    }

    .balance-actions {
      justify-content: flex-end;
      align-items: center;
      gap: 8px;

      .btn-primary {
        min-width: 122px;
        height: 40px;
        padding: 0 14px;
      }
    }
  }

  .referral-kpi-card {
    padding: 16px 20px;
  }

  .referral-kpi-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 12px;
  }

  .kpi-item {
    border: 1px solid var(--border-color);
    border-radius: 10px;
    padding: 12px;
    background: rgba(var(--theme-color-rgb), 0.03);
  }

  .kpi-label {
    font-size: $font-size-sm;
    color: var(--text-tertiary);
    margin-bottom: 6px;
  }

  .kpi-value {
    font-size: $font-size-xl;
    font-weight: $font-weight-bold;
    line-height: 1.1;
  }

  .invite-cards-container {
    margin: 16px 0 10px;
    padding: 0;
  }

  .invite-card {
    min-height: 140px;
  }

  .invite-card-inner {
    padding: 14px;
  }

  .invite-card-header {
    margin-bottom: 10px;
  }

  .invite-card-body {
    min-height: auto;
  }

  .invite-code-display {
    font-size: $font-size-xl;
    padding: 8px 12px;
  }
}

@media (max-width: 1100px) {
  .account-container {
    .stats-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .compact-stepper {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .balance-container {
      grid-template-columns: 1fr;

      .balance-actions {
        width: 100%;
        justify-content: flex-start;
      }
    }

    .referral-kpi-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
}

@media (max-width: #{$bp-md}) {
  .account-container {
    .dashboard-card {
      padding: 20px;
      margin-bottom: 16px;
    }

    .stats-grid,
    .compact-stepper {
      grid-template-columns: 1fr;
      gap: 12px;
    }

    .balance-container {
      .balance-actions {
        flex-direction: column;

        .btn-primary {
          width: 100%;
        }
      }
    }

    .referral-kpi-grid {
      grid-template-columns: 1fr;
      gap: 10px;
    }
  }
}

</style>
          </head>
          <body>
            <h2>${t('invite.share.scanQRCode')}</h2>
            <img src="${qrCodeUrl}" alt="${t('invite.share.inviteQRCode')}" />
            <p>${t('invite.share.orCopyLink')}: ${inviteLink.value}</p>
          </body>
        </html>
      `);
    };
    
    const shareToTwitter = () => {
      if (!inviteLink.value) {
        showToast(t('invite.share.noLinkAvailable'), 'error');
        return;
      }
      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(t('invite.share.shareDescription'))}&url=${encodeURIComponent(inviteLink.value)}`, '_blank');
    };
    
    const shareToTelegram = () => {
      if (!inviteLink.value) {
        showToast(t('invite.share.noLinkAvailable'), 'error');
        return;
      }
      window.open(`https://t.me/share/url?url=${encodeURIComponent(inviteLink.value)}&text=${encodeURIComponent(t('invite.share.shareDescription'))}`, '_blank');
    };
    
    const shareToQQ = () => {
      if (!inviteLink.value) {
        showToast(t('invite.share.noLinkAvailable'), 'error');
        return;
      }
      window.open(`https://connect.qq.com/widget/shareqq/index.html?url=${encodeURIComponent(inviteLink.value)}&title=${encodeURIComponent(t('invite.share.shareTitle'))}&desc=${encodeURIComponent(t('invite.share.shareDescription'))}`, '_blank');
    };
    
    const refreshRecords = () => {
      if (loading.inviteDetails) return;
      
      showToast(t('invite.records.refreshingData'), 'info');
      currentPage.value = 1; 
      fetchInviteDetails(1);
    };
    
    const formatDate = (timestamp) => {
      if (!timestamp) return '-';
      const date = new Date(timestamp * 1000);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      
      return `${year}-${month}-${day} ${hours}:${minutes}`;
    };
    
    const getStatusClass = (status) => {
      switch (status) {
        case 0: return 'waiting';  
        case 1: return 'pending';  
        case 2: return 'success';  
        case 3: return 'danger';   
        default: return 'waiting';
      }
    };
    
    const getStatusText = (status) => {
      switch (status) {
        case 0: return t('invite.records.status.waiting');
        case 1: return t('invite.records.status.processing');
        case 2: return t('invite.records.status.confirmed');
        case 3: return t('invite.records.status.invalid');
        default: return t('invite.records.status.unknown');
      }
    };
    
    const fetchInviteData = async () => {
      loading.inviteData = true;
      try {
        const res = await getInviteData();
        if (res.data) {
          inviteCodes.value = res.data.codes || [];
          if (res.data.stat) {
            inviteStats.registeredUsers = res.data.stat[0] || 0;
            inviteStats.validCommission = ((res.data.stat[1] || 0) / 100).toFixed(2); 
            inviteStats.pendingCommission = ((res.data.stat[2] || 0) / 100).toFixed(2); 
            inviteStats.commissionRate = res.data.stat[3] || 0;
            inviteStats.availableCommission = ((res.data.stat[4] || 0) / 100).toFixed(2); 
          }
        }
      } catch (err) {
        console.error('获取邀请数据失败:', err);
        showToast(t('invite.records.fetchDataError'), 'error');
      } finally {
        loading.inviteData = false;
      }
    };
    
    const fetchInviteDetails = async (page = 1) => {
      loading.inviteDetails = true;
      try {
        const recordsPerPage = Math.max(pageSize.value, 10);
        const res = await getInviteDetails(page, recordsPerPage);
        
        if (res.data) {
          inviteRecords.value = Array.isArray(res.data) ? res.data.map(record => ({
            id: record.id,
            trade_no: record.trade_no,
            created_at: record.created_at,
            user: record.user || null,
            amount: record.order_amount ? (record.order_amount / 100).toFixed(2) : '0.00',
            commission_amount: record.get_amount ? (record.get_amount / 100).toFixed(2) : '0.00',
            commission_status: 1 
          })) : [];
          
          totalRecords.value = res.total || inviteRecords.value.length;
        } else {
          inviteRecords.value = [];
          totalRecords.value = 0;
        }
      } catch (err) {
        console.error('获取邀请明细失败:', err);
        showToast(t('invite.records.fetchError'), 'error');
        inviteRecords.value = [];
        totalRecords.value = 0;
      } finally {
        loading.inviteDetails = false;
      }
    };
    
    const fetchCommConfig = async () => {
      loading.commConfig = true;
      try {
        const res = await getCommissionConfig();
        if (res.data) {
          currency.value = res.data.currency || 'CNY';
          currencySymbol.value = res.data.currency_symbol || '¥';
          
          withdrawClose.value = Number(res.data.withdraw_close);
          
          withdrawMethods.value = res.data.withdraw_methods || []; 
          
          if (res.data.min_withdraw_amount) {
            minWithdrawAmount.value = parseFloat(res.data.min_withdraw_amount) / 100; 
          }
        }
      } catch (err) {
        console.error('获取佣金配置失败:', err);
      } finally {
        loading.commConfig = false;
      }
    };
    
    const prevInviteCode = () => {
      if (inviteCodes.value.length > 1) {
        selectedCodeIndex.value = (selectedCodeIndex.value - 1 + inviteCodes.value.length) % inviteCodes.value.length;
      }
    };
    
    const nextInviteCode = () => {
      if (inviteCodes.value.length > 1) {
        selectedCodeIndex.value = (selectedCodeIndex.value + 1) % inviteCodes.value.length;
      }
    };
    
    const formatCodeDate = (timestamp) => {
      if (!timestamp) return '';
      const date = new Date(timestamp * 1000);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const day = date.getDate();
      return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    };
    
    const showTransferCardState = ref(false);
    const transferAmount = ref(0);
    const transferError = ref('');
    const transferLoading = ref(false);
    const isTransferDisabled = computed(() => transferAmount.value <= 0 || transferAmount.value > inviteStats.availableCommission);
    
    const toggleTransferCard = () => {
      if (showWithdrawCard.value) {
        pendingCardAction.value = 'transfer';
        showWithdrawCard.value = false;
      } else {
        showTransferCardState.value = true;
        transferAmount.value = '';
        transferError.value = '';
      }
    };
    
    const validateTransferAmount = () => {
      transferError.value = '';
      
      if (!transferAmount.value || parseFloat(transferAmount.value) <= 0) {
        transferError.value = t('invite.transfer.invalidAmount');
        return false;
      }
      
      if (parseFloat(transferAmount.value) > parseFloat(inviteStats.availableCommission)) {
        transferError.value = t('invite.transfer.insufficientFunds');
        return false;
      }
      
      return true;
    };
    
    const confirmTransfer = async () => {
      if (!validateTransferAmount()) return;
      
      transferLoading.value = true;
      
      try {
        const amountInCents = Math.round(parseFloat(transferAmount.value) * 100);
        const res = await transferCommission(amountInCents);
        
        if (res.data === true) {
          transferAmount.value = 0;
          transferError.value = '';
          
          handleSuccess(t('invite.transfer.success'));
          
          await fetchInviteData();
          
          showTransferCardState.value = false;
        } else {
          transferError.value = res.message || t('invite.transfer.failure');
        }
      } catch (error) {
        handleError(error);
        transferError.value = error.response?.message || t('invite.transfer.failure');
      } finally {
        transferLoading.value = false;
      }
    };
    
    const toggleWithdrawCard = () => {
      if (showTransferCardState.value) {
        pendingCardAction.value = 'withdraw';
        showTransferCardState.value = false;
      } else {
        showWithdrawCard.value = true;
        withdrawAccount.value = '';
        withdrawAmount.value = '';
        withdrawError.value = '';
        
        if (withdrawMethods.value.length > 0) {
          selectedWithdrawMethod.value = withdrawMethods.value[0];
        } else {
          selectedWithdrawMethod.value = '';
        }
      }
    };
    
    const closeWithdrawCard = () => {
      showWithdrawCard.value = false;
      withdrawError.value = '';
    };
    
    const toggleMethodDropdown = () => {
      if (withdrawMethods.value.length === 0) return;
      showMethodDropdown.value = !showMethodDropdown.value;
    };
    
    const selectWithdrawMethod = (method) => {
      selectedWithdrawMethod.value = method;
      showMethodDropdown.value = false;
    };
    
    const closeDropdownOnClickOutside = (event) => {
      const dropdown = document.querySelector('.custom-select');
      if (dropdown && !dropdown.contains(event.target)) {
        showMethodDropdown.value = false;
      }
    };
    
    const submitWithdraw = async () => {
      if (!withdrawAccount.value || !selectedWithdrawMethod.value) {
        withdrawError.value = t('validation.required', { field: t('invite.withdraw.account') });
        return;
      }
      
      const amount = parseFloat(withdrawAmount.value);
      if (isNaN(amount) || amount <= 0) {
        withdrawError.value = t('invite.withdraw.invalidAmount');
        showToast(withdrawError.value, 'error');
        return;
      }
      
      if (amount > parseFloat(inviteStats.availableCommission)) {
        withdrawError.value = t('invite.withdraw.insufficientFunds');
        showToast(withdrawError.value, 'error');
        return;
      }
      
      if (amount < minWithdrawAmount.value && minWithdrawAmount.value > 0) {
        withdrawError.value = t('invite.withdraw.belowMinAmount', { 
          amount: currencySymbol.value + minWithdrawAmount.value + currency.value 
        });
        showToast(withdrawError.value, 'error');
        return;
      }
      
      withdrawLoading.value = true;
      
      try {
        const amountInCents = Math.round(amount * 100);
        
        const res = await withdrawCommission(
          amountInCents,
          withdrawAccount.value,
          selectedWithdrawMethod.value
        );
        
        if (res.data === true) {
          withdrawAccount.value = '';
          withdrawAmount.value = '';
          withdrawError.value = '';
          
          handleSuccess(t('invite.withdraw.success'));
          
          await fetchInviteData();
          
          showWithdrawCard.value = false;
        } else {
          withdrawError.value = res.message || t('invite.withdraw.failure');
          showToast(withdrawError.value, 'error');
        }
      } catch (error) {
        console.error('提现请求错误:', error);
        if (error.response && error.response.data && error.response.data.message) {
          withdrawError.value = error.response.data.message;
        } else if (error.message) {
          withdrawError.value = error.message;
        } else {
          withdrawError.value = t('invite.withdraw.failure');
        }
        showToast(withdrawError.value, 'error');
      } finally {
        withdrawLoading.value = false;
      }
    };

    const isMobile = ref(false); 
    
    const initClientSideState = () => {
      if (typeof window !== 'undefined') {
        isMobile.value = window.innerWidth <= 768;
      }
    };
    
    const handleResize = () => {
      if (typeof window !== 'undefined') {
        isMobile.value = window.innerWidth <= 768;
        nextTick(() => {
          displayPageNumbers.value;
        });
      }
    };
    
    onMounted(() => {
      initClientSideState();
      
      document.addEventListener('click', closeDropdownOnClickOutside);
      document.addEventListener('click', closePageSizeDropdownOnClickOutside);
      
      if (typeof window !== 'undefined') {
        window.addEventListener('resize', handleResize);
      }
      
      fetchInviteData();
      currentPage.value = 1;
      fetchInviteDetails(1);
      fetchCommConfig();
      
      pageSize.value = INVITE_CONFIG.recordsPerPage || 10;
    });
    
    onUnmounted(() => {
      document.removeEventListener('click', closeDropdownOnClickOutside);
      document.removeEventListener('click', closePageSizeDropdownOnClickOutside);
      window.removeEventListener('resize', handleResize);
    });
    
    const withdrawClose = ref(1); 
    const withdrawMethods = ref([]); 
    const showWithdrawCard = ref(false); 
    const withdrawAccount = ref(''); 
    const withdrawAmount = ref(''); 
    const selectedWithdrawMethod = ref(''); 
    const showMethodDropdown = ref(false); 
    const withdrawError = ref(''); 
    const withdrawLoading = ref(false); 
    const minWithdrawAmount = ref(0); 
    
    const pendingCardAction = ref(null);
    
    const onTransferCardHidden = () => {
      if (pendingCardAction.value === 'withdraw') {
        pendingCardAction.value = null;
        showWithdrawCard.value = true;
        nextTick(() => {
          setTimeout(() => {
            const withdrawCard = document.querySelector('.withdraw-card');
            if (withdrawCard) {
              withdrawCard.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'center' 
              });
            }
          }, 100);
        });
      }
    };
    
    const onWithdrawCardHidden = () => {
      if (pendingCardAction.value === 'transfer') {
        pendingCardAction.value = null;
        showTransferCardState.value = true;
        nextTick(() => {
          setTimeout(() => {
            const transferCard = document.querySelector('.transfer-card');
            if (transferCard) {
              transferCard.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'center' 
              });
            }
          }, 100);
        });
      }
    };
    
    const handleSuccess = (message) => {
      showToast(message, 'success');
    };
    
    const handleError = (error) => {
      console.error('Error:', error);
      const message = error.response?.message || t('common.error');
      showToast(message, 'error');
    };
    const goBackToAccount = () => {
      if (window.history.length > 1) {
        router.back();
        return;
      }
      router.push('/profile');
    };
    
    return {
      loading,
      creatingCode,
      inviteCodes,
      selectedCodeIndex,
      inviteStats,
      inviteRecords,
      inviteLink,
      currency,
      currencySymbol,
      copyInviteLink,
      createInviteCode,
      shareToWechat,
      shareToTwitter,
      shareToTelegram,
      shareToQQ,
      refreshRecords,
      formatDate,
      getStatusClass,
      getStatusText,
      showConfirmModal,
      confirmModalMessage,
      confirmAction,
      cancelConfirmation,
      prevInviteCode,
      nextInviteCode,
      formatCodeDate,
      showTransferCardState,
      transferAmount,
      transferError,
      transferLoading,
      isTransferDisabled,
      toggleTransferCard,
      confirmTransfer,
      withdrawClose,
      withdrawMethods,
      showWithdrawCard,
      withdrawAccount,
      withdrawAmount,
      selectedWithdrawMethod,
      showMethodDropdown,
      withdrawError,
      withdrawLoading,
      minWithdrawAmount,
      toggleWithdrawCard,
      closeWithdrawCard,
      toggleMethodDropdown,
      selectWithdrawMethod,
      submitWithdraw,
      onTransferCardHidden,
      onWithdrawCardHidden,
      handleSuccess,
      handleError,
      t, 
      currentPage,
      pageSize,
      totalRecords,
      paginatedRecords,
      handlePageChange,
      totalPages,
      displayPageNumbers, 
      pageSizeOptions,
      showPageSizeDropdown,
      togglePageSizeDropdown,
      selectPageSize,
      closePageSizeDropdownOnClickOutside,
      isMobile,
      goBackToAccount
    };
  }
};
</script>

<style lang="scss" scoped>
@use "@/assets/styles/base/variables.scss" as *;
@use "@/assets/styles/base/typography.scss" as *;

.account-container {
  padding: 8px;
  display: flex;
  justify-content: center;
}

.account-inner {
  width: 100%;
  display: grid;
  gap: 10px;
}

.dashboard-card {
  background: var(--card-bg-color);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 12px;
}

.card-header {
  margin-bottom: 8px;
}

.card-title {
  margin: 0;
  @extend %typo-item-title;
}

.balance-container {
  display: grid;
  gap: 10px;
}

.balance-value {
  font-size: $font-size-xl;
  font-weight: $font-weight-bold;
  color: var(--theme-color);
}

.balance-actions {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.btn-primary,
.btn-outline,
.btn-submit,
.btn-cancel {
  height: 38px;
  border-radius: 10px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 0 10px;
}

.referral-kpi-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.kpi-item {
  border: 1px solid var(--border-color);
  border-radius: 10px;
  padding: 8px;
}

.kpi-label {
  @extend %typo-label-text;
}

.kpi-value {
  margin-top: 4px;
  @extend %typo-item-title;
}

.invite-codes-wrapper {
  display: grid;
  gap: 10px;
}

.invite-cards-container {
  display: grid;
  grid-template-columns: 30px 1fr 30px;
  align-items: center;
  gap: 8px;
}

.invite-cards-nav {
  width: 30px;
  height: 30px;
  border: 1px solid var(--border-color);
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--text-tertiary);
}

.invite-cards-wrapper {
  overflow: hidden;
}

.invite-cards {
  display: flex;
  gap: 8px;
}

.invite-card {
  min-width: 100%;
}

.invite-card-inner {
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 12px;
}

.invite-card-title {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-weight: $font-weight-bold;
}

.invite-code-display {
  margin-top: 10px;
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.code-char {
  min-width: 20px;
  padding: 3px 5px;
  border-radius: 6px;
  border: 1px solid var(--border-color);
  text-align: center;
  font-weight: $font-weight-semibold;
}

.invite-card-footer {
  margin-top: 10px;
  font-size: $font-size-sm;
  color: var(--text-tertiary);
}

.invite-cards-indicators {
  display: flex;
  justify-content: center;
  gap: 6px;
}

.indicator {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: rgba(var(--text-color-rgb), 0.22);

  &.active {
    background: rgba(var(--theme-color-rgb), 0.9);
  }
}

.invite-link-wrapper {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 8px;
}

.input-with-icon {
  display: flex;
  align-items: center;
  gap: 8px;
  border: 1px solid var(--border-color);
  border-radius: 10px;
  padding: 0 10px;
}

.invite-link {
  flex: 1;
  min-width: 0;
  height: 38px;
  border: none;
  background: transparent;
  color: var(--text-primary);
}

.share-buttons {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.records-table-wrapper {
  overflow-x: auto;
}

.records-table {
  width: 100%;
  border-collapse: collapse;
  font-size: $font-size-sm;
}

.records-table th,
.records-table td {
  border-bottom: 1px solid var(--border-color);
  padding: 8px 6px;
  white-space: nowrap;
}

.modal-overlay,
.custom-modal {
  position: fixed;
  inset: 0;
  z-index: 1000;
}

.modal-overlay {
  background: rgba(0, 0, 0, 0.45);
}

.modal-content,
.modal-container {
  width: min(94vw, 420px);
  margin: 8vh auto 0;
  background: var(--card-bg-color);
  border-radius: 12px;
  border: 1px solid var(--border-color);
  padding: 14px;
}

.account-back-btn {
  width: fit-content;
  border: none;
  background: transparent;
  color: var(--text-primary);
  display: inline-flex;
  align-items: center;
  padding: 0;
}

.back-label {
  display: none;
}

@media (min-width: 900px) {
  .account-container {
    padding: 14px;
  }

  .dashboard-card {
    padding: 16px;
  }

  .referral-kpi-grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }

  .invite-link-wrapper {
    grid-template-columns: 1fr 180px;
  }

  .share-buttons {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}
</style>
