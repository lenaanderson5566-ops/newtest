<template>
  <div class="dashboard-container">
    <div class="dashboard-inner">
      <div class="overview-grid">
      <!-- 通知区域 -->
      <!-- 待支付订单提醒条 -->
      <div
        v-if="hasPendingItems"
        class="pending-order-banner"
        :class="{'card-animate': !loading.userStats}"
        style="animation-delay: 0.1s"
        @click="goToOrders"
      >
        <div class="banner-main">
          <IconAlertTriangle :size="16" class="banner-icon" />
          <span class="banner-text">{{ $t('dashboard.pendingOrderBanner', { count: userStats.pendingOrders }) }}</span>
        </div>
        <button class="banner-action" @click.stop="goToOrders">{{ $t('dashboard.payNow') }}</button>
      </div>


      <!-- 订阅导入卡片 -->
      <transition name="slide-fade">
        <div v-if="showImportCard && userPlan.subscribeUrl" class="dashboard-card import-card">
          <div class="card-header">
            <h2 class="card-title">{{ $t('dashboard.importSubscription') }}</h2>
            <button class="close-btn" @click="showImportCard = false">
              <span class="close-icon"></span>
            </button>
          </div>
          <div class="card-body">
            <div class="import-action copy-action" @click="copySubscription">
              <div class="import-icon">
                <IconCopy :size="24"/>
              </div>
              <div class="import-content">
                <div class="import-title">{{ $t('dashboard.copySubscription') }}</div>
                <div class="import-desc">{{ $t('dashboard.copySubscriptionDesc') }}</div>
              </div>
            </div>

            <div class="import-action qrcode-action" @click="showQrCode = true">
              <div class="import-icon">
                <IconQrcode :size="24"/>
              </div>
              <div class="import-content">
                <div class="import-title">{{ $t('dashboard.scanQRCode') }}</div>
                <div class="import-desc">{{ $t('dashboard.scanQRCodeDesc') }}</div>
              </div>
            </div>

            <!-- 平台选择器 -->
            <div class="platform-selector">
              <button
                  v-for="platform in platforms"
                  :key="platform.id"
                  class="platform-button"
                  :class="{ 'active': activePlatform === platform.id }"
                  @click="activePlatform = platform.id"
              >
                <component :is="platform.icon" :size="16"/>
                <span>{{ $t(`platforms.${platform.id}`) }}</span>
              </button>
            </div>

            <!-- iOS平台选项 -->
            <div v-if="activePlatform === 'ios'" class="platform-section">
              <div class="platform-title">{{ $t('platforms.ios') }}</div>
              <div v-if="hasIOSClients" class="platform-options">
                <div v-if="clientConfig.showShadowrocket" class="platform-option"
                     @click="importToClient('shadowrocket')">
                  <img :src="shadowrocketIcon" class="client-icon" alt="Shadowrocket"/>
                  <span>Shadowrocket</span>
                </div>
                <div v-if="clientConfig.showSurge" class="platform-option" @click="importToClient('surge')">
                  <img :src="surgeIcon" class="client-icon" alt="Surge"/>
                  <span>Surge</span>
                </div>
                <div v-if="clientConfig.showStash" class="platform-option" @click="importToClient('stash')">
                  <img :src="stashIcon" class="client-icon" alt="Stash"/>
                  <span>Stash</span>
                </div>
                <div v-if="clientConfig.showQuantumultX" class="platform-option" @click="importToClient('quantumultx')">
                  <img :src="quantumultIcon" class="client-icon" alt="Quantumult X"/>
                  <span>Quantumult X</span>
                </div>
                <div v-if="clientConfig.showHiddifyIOS" class="platform-option" @click="importToClient('hiddify-ios')">
                  <img :src="hiddifyMacIcon" class="client-icon" alt="Hiddify"/>
                  <span>Hiddify</span>
                </div>
                <div v-if="clientConfig.showSingboxIOS" class="platform-option" @click="importToClient('singbox-ios')">
                  <img :src="singboxIcon" class="client-icon" alt="Singbox"/>
                  <span>Singbox</span>
                </div>
                <div v-if="clientConfig.showLoon" class="platform-option" @click="importToClient('loon')">
                  <img :src="loonIcon" class="client-icon" alt="Loon"/>
                  <span>Loon</span>
                </div>
              </div>
              <div v-else class="no-clients-message">
                <p>{{ $t('dashboard.noClientsAvailable') }}</p>
              </div>
            </div>

            <!-- Android平台选项 -->
            <div v-if="activePlatform === 'android'" class="platform-section">
              <div class="platform-title">{{ $t('platforms.android') }}</div>
              <div v-if="hasAndroidClients" class="platform-options">
                <div v-if="clientConfig.showFlClashAndroid" class="platform-option" @click="importToClient('flclash')">
                  <img :src="flclashIcon" class="client-icon" alt="FlClash"/>
                  <span>FlClash</span>
                </div>
                <div v-if="clientConfig.showV2rayNG" class="platform-option" @click="importToClient('v2rayng')">
                  <img :src="v2rayNGIcon" class="client-icon" alt="V2rayNG"/>
                  <span>V2rayNG</span>
                </div>
                <div v-if="clientConfig.showClashAndroid" class="platform-option"
                     @click="importToClient('clash-android')">
                  <img :src="clashAndroidIcon" class="client-icon" alt="Clash"/>
                  <span>Clash</span>
                </div>
                <div v-if="clientConfig.showSurfboard" class="platform-option" @click="importToClient('surfboard')">
                  <img :src="surfboardIcon" class="client-icon" alt="Surfboard"/>
                  <span>Surfboard</span>
                </div>
                <div v-if="clientConfig.showClashMetaAndroid" class="platform-option"
                     @click="importToClient('clash-meta-android')">
                  <img :src="clashMetaAndroidIcon" class="client-icon" alt="Clash Meta"/>
                  <span>Clash Meta</span>
                </div>
                <div v-if="clientConfig.showNekobox" class="platform-option" @click="importToClient('nekobox')">
                  <img :src="nekoboxIcon" class="client-icon" alt="Nekobox"/>
                  <span>Nekobox</span>
                </div>
                <div v-if="clientConfig.showSingboxAndroid" class="platform-option"
                     @click="importToClient('singbox-android')">
                  <img :src="singboxAndroidIcon" class="client-icon" alt="Singbox"/>
                  <span>Singbox</span>
                </div>
                <div v-if="clientConfig.showHiddifyAndroid" class="platform-option"
                     @click="importToClient('hiddify-android')">
                  <img :src="hiddifyAndroidIcon" class="client-icon" alt="Hiddify"/>
                  <span>Hiddify</span>
                </div>
              </div>
              <div v-else class="no-clients-message">
                <p>{{ $t('dashboard.noClientsAvailable') }}</p>
              </div>
            </div>

            <!-- Windows平台选项 -->
            <div v-if="activePlatform === 'windows'" class="platform-section">
              <div class="platform-title">{{ $t('platforms.windows') }}</div>
              <div v-if="hasWindowsClients" class="platform-options">
                <div v-if="clientConfig.showFlClashWindows" class="platform-option" @click="importToClient('flclash')">
                  <img :src="flclashIcon" class="client-icon" alt="FlClash"/>
                  <span>FlClash</span>
                </div>
                <div v-if="clientConfig.showClashVergeWindows" class="platform-option" @click="importToClient('clashverge')">
                  <img :src="clashvergeIcon" class="client-icon" alt="ClashVerge"/>
                  <span>ClashVerge</span>
                </div>
                <div v-if="clientConfig.showClashWindows" class="platform-option" @click="importToClient('clash')">
                  <img :src="clashWindowsIcon" class="client-icon" alt="Clash"/>
                  <span>Clash</span>
                </div>
                <div v-if="clientConfig.showNekoray" class="platform-option" @click="importToClient('nekoray')">
                  <img :src="nekorayIcon" class="client-icon" alt="Nekoray"/>
                  <span>Nekoray</span>
                </div>
                <div v-if="clientConfig.showSingboxWindows" class="platform-option"
                     @click="importToClient('singbox-windows')">
                  <img :src="singboxWindowsIcon" class="client-icon" alt="Singbox"/>
                  <span>Singbox</span>
                </div>
                <div v-if="clientConfig.showHiddifyWindows" class="platform-option"
                     @click="importToClient('hiddify-windows')">
                  <img :src="hiddifyWindowsIcon" class="client-icon" alt="Hiddify"/>
                  <span>Hiddify</span>
                </div>
              </div>
              <div v-else class="no-clients-message">
                <p>{{ $t('dashboard.noClientsAvailable') }}</p>
              </div>
            </div>

            <!-- MacOS平台选项 -->
            <div v-if="activePlatform === 'macos'" class="platform-section">
              <div class="platform-title">{{ $t('platforms.macos') }}</div>
              <div v-if="hasMacOSClients" class="platform-options">
                <div v-if="clientConfig.showFlClashMac" class="platform-option" @click="importToClient('flclash')">
                  <img :src="flclashIcon" class="client-icon" alt="FlClash"/>
                  <span>FlClash</span>
                </div>
                <div v-if="clientConfig.showClashVergeMac" class="platform-option" @click="importToClient('clashverge')">
                  <img :src="clashvergeIcon" class="client-icon" alt="ClashVerge"/>
                  <span>ClashVerge</span>
                </div>
                <div v-if="clientConfig.showClashX" class="platform-option" @click="importToClient('clashx')">
                  <img :src="clashXIcon" class="client-icon" alt="ClashX"/>
                  <span>ClashX</span>
                </div>
                <div v-if="clientConfig.showClashMetaX" class="platform-option" @click="importToClient('clashx-meta')">
                  <img :src="clashMetaXIcon" class="client-icon" alt="ClashX Meta"/>
                  <span>ClashX Meta</span>
                </div>
                <div v-if="clientConfig.showSurgeMac" class="platform-option" @click="importToClient('surge-mac')">
                  <img :src="surgeMacIcon" class="client-icon" alt="Surge"/>
                  <span>Surge</span>
                </div>
                <div v-if="clientConfig.showStashMac" class="platform-option" @click="importToClient('stash-mac')">
                  <img :src="stashMacIcon" class="client-icon" alt="Stash"/>
                  <span>Stash</span>
                </div>
                <div v-if="clientConfig.showQuantumultXMac" class="platform-option"
                     @click="importToClient('quantumultx-mac')">
                  <img :src="quantumultXMacIcon" class="client-icon" alt="Quantumult X"/>
                  <span>Quantumult X</span>
                </div>
                <div v-if="clientConfig.showSingboxMac" class="platform-option"
                     @click="importToClient('singbox-macos')">
                  <img :src="singboxMacIcon" class="client-icon" alt="Singbox"/>
                  <span>Singbox</span>
                </div>
                <div v-if="clientConfig.showHiddifyMac" class="platform-option"
                     @click="importToClient('hiddify-macos')">
                  <img :src="hiddifyMacIcon" class="client-icon" alt="Hiddify"/>
                  <span>Hiddify</span>
                </div>
              </div>
              <div v-else class="no-clients-message">
                <p>{{ $t('dashboard.noClientsAvailable') }}</p>
              </div>
            </div>
          </div>
        </div>
      </transition>

      <!-- QR码模态窗口 -->
      <transition name="fade">
        <div v-if="showQrCode" class="qrcode-modal-overlay" @click="showQrCode = false">
          <div class="qrcode-modal" @click.stop>
            <div class="qrcode-header">
              <h3>{{ $t('dashboard.scanQRCode') }}</h3>
              <button class="close-btn" @click="showQrCode = false">
                <span class="close-icon"></span>
              </button>
            </div>
            <div class="qrcode-content">
              <div v-if="qrCodeLoading" class="qrcode-loading">
                <div class="loading-spinner"></div>
                <p>{{ $t('common.loadingQRCode') }}</p>
              </div>
              <img v-else :src="qrCodeUrl" alt="QR Code" @load="qrCodeLoaded"/>
            </div>
          </div>
        </div>
      </transition>

      <div class="stats-grid">
        <template v-if="loading.userStats">
          <div v-for="i in 4" :key="i" class="stats-card skeleton-card">
            <div class="skeleton-icon"></div>
            <div class="skeleton-content">
              <div class="skeleton-row-sm"></div>
              <div class="skeleton-row-xs"></div>
            </div>
          </div>
        </template>

        <template v-else-if="!hasPlan">
          <!-- 没有套餐时显示的提示卡片 -->
          <InfoCard class="dashboard-card stats-card no-plan-card" :class="{'card-animate': !loading.userStats}"
               style="animation-delay: 0.5s; grid-column: span 4; margin: 0 auto; max-width: 1200px; width: 100%;">
            <template #icon>
              <div class="no-plan-icon">
                <IconShoppingCart :size="45" class="icon-cart"/>
              </div>
            </template>
            <template #title>{{ $t('dashboard.noPlanPrompt') }}</template>
            <template #action>
              <button class="action-button primary" @click="goToShop">
                <IconShoppingBag :size="18" class="btn-icon"/>
                <span>{{ $t('dashboard.purchasePlan') }}</span>
              </button>
            </template>
          </InfoCard>
        </template>

        <template v-else>
          <div
            class="stats-card traffic-board-card"
            v-for="(card, idx) in trafficBoardSections"
            :key="card.key"
            :class="[`traffic-board-${card.key}`, { 'card-animate': !loading.userStats }, { 'total-main-card': card.key === 'total' }, { 'expired-main-card': card.key === 'total' && isPlanExpired }, { 'package-card-muted': card.key === 'package' && (!hasPurchasedTrafficPackage || isPlanExpired) }, { 'subscription-card-muted': card.key === 'subscription' && isPlanExpired }, { 'expired-blur-target': isPlanExpired && (card.key === 'subscription' || card.key === 'package') }]"
            :style="{ animationDelay: `${0.5 + idx * 0.1}s` }"
          >
            <div class="usage-card-title">
              <span>{{ card.key === 'total' ? $t('dashboard.subscriptionInfo') : card.title }}</span>
              <span
                v-if="card.key === 'package'"
                class="info-tooltip"
                tabindex="0"
                role="button"
                :aria-label="$t('dashboard.trafficPackageHint')"
              >
                <IconHelpCircle :size="14" />
                <span class="info-tooltip-content">{{ $t('dashboard.trafficPackageHint') }}</span>
              </span>
            </div>
            <div v-if="card.key === 'total'" class="plan-summary-card">
              <div v-if="isPlanExpired" class="expired-status-strip">
                {{ $t('dashboard.subscriptionPausedAfterExpiry') }}
              </div>
              <div class="plan-summary-section plan-summary-section-meta">
                <div class="plan-status-hero">
                  <div class="plan-name-main">{{ userPlan.name || '-' }}</div>
                  <div class="plan-expire-meta">
                    <span>{{ planExpireMetaText }}</span>
                    <span class="plan-status-tag" :class="`is-${subscriptionStatus}`">{{ subscriptionStatusLabel }}</span>
                  </div>
                </div>
              </div>

              <div class="plan-summary-section plan-summary-section-renew">
                <div class="plan-summary-row auto-renewal-row">
                  <div>
                    <span class="plan-summary-label with-tooltip">
                      <span>{{ $t('profile.autoRenewal') }}</span>
                      <span class="info-tooltip" tabindex="0" role="button" :aria-label="$t('profile.autoRenewalDesc')">
                        <IconHelpCircle :size="14" />
                        <span class="info-tooltip-content">{{ $t('profile.autoRenewalDesc') }}</span>
                      </span>
                    </span>
                  </div>
                  <label class="switch" :class="{ disabled: updatingAutoRenewalSetting }">
                    <input
                      type="checkbox"
                      v-model="autoRenewalEnabled"
                      :disabled="updatingAutoRenewalSetting"
                      @change="updateAutoRenewalSetting"
                    />
                    <span class="slider round" :class="{ loading: updatingAutoRenewalSetting }"></span>
                  </label>
                </div>
              </div>

              <div class="plan-summary-section plan-summary-section-actions">
                <div class="plan-summary-actions">
                  <button
                    class="plan-action-btn"
                    :class="primaryActionClass"
                    @click="handlePrimaryPlanAction"
                  >
                    {{ primaryPlanActionLabel }}
                  </button>
                  <button
                    class="plan-action-btn"
                    :class="secondaryActionClass"
                    @click="handleSecondaryPlanAction"
                  >
                    {{ secondaryPlanActionLabel }}
                  </button>
                </div>
                <div v-if="isPlanExpired" class="plan-action-helper-text">
                  {{ $t('dashboard.renewToRestoreAccess') }}
                </div>
              </div>
            </div>
            <div v-else class="usage-card-main" :class="{ 'package-main': card.key === 'package' }">
              <template v-if="card.key === 'package'">
                <span class="usage-percent compact">{{ formatPackageRemaining(card.remaining) }}</span>
                <span class="usage-percent-label">{{ $t('dashboard.remaining') }}</span>
                <button class="package-add-btn" @click.stop="openTrafficPackageModal" :title="$t('dashboard.purchaseTrafficPackage')">
                  <IconPlus :size="14" />
                </button>
              </template>
              <template v-else>
                <template v-if="card.key === 'subscription'">
                  <span class="usage-percent compact">{{ formatPackageRemaining(isPlanExpired ? 0 : card.remaining) }}</span>
                  <span class="usage-percent-label">{{ $t('dashboard.remaining') }}</span>
                </template>
                <template v-else>
                  <span class="usage-percent">{{ card.remainingPercentage }}%</span>
                  <span class="usage-percent-label">{{ $t('dashboard.remaining') }}</span>
                </template>
              </template>
            </div>
            <div v-if="card.key !== 'package' && card.key !== 'total'" class="section-progress-track">
              <div class="section-progress-fill" :style="{ width: `${card.key === 'subscription' && isPlanExpired ? 0 : card.remainingPercentage}%` }"></div>
            </div>
            <div class="usage-kpis" v-if="card.key !== 'package' && card.key !== 'total'">
              <template v-if="card.key === 'subscription'">
                <div class="usage-summary-line persist-visible">
                  {{ $t('dashboard.used') }} {{ formatPackageRemaining(isPlanExpired ? 0 : card.used) }} / {{ formatPackageRemaining(card.total) }}
                </div>
              </template>
              <template v-else>
                <div class="usage-kpi">
                  <span class="usage-kpi-label">{{ $t('dashboard.total') }}</span>
                  <strong class="usage-kpi-value">{{ formatPackageRemaining(card.total) }}</strong>
                </div>
                <div class="usage-kpi">
                  <span class="usage-kpi-label">{{ $t('dashboard.remaining') }}</span>
                  <strong class="usage-kpi-value">{{ formatPackageRemaining(card.remaining) }}</strong>
                </div>
              </template>
            </div>
            <div v-if="card.key === 'subscription'" class="usage-reset-hint persist-visible">
              {{ $t('dashboard.resetTimeLabel') }} {{ userPlan.resetDateTime || '-' }}
            </div>
          </div>

        </template>
      </div>

      <div class="dashboard-card ip-location-summary-card" v-if="hasPlan">
        <div class="card-body ip-location-summary-body">
          <div v-if="ipLocationLoading" class="ip-location-state">{{ $t('common.loading') }}...</div>
          <div v-else-if="ipLocationError" class="ip-location-state error">{{ ipLocationError }}</div>
          <div v-else-if="ipLocationData" class="ip-location-content">
            <div class="ip-location-main-info">
              <div class="ip-meta-title">{{ $t('dashboard.currentExitRegion') }}</div>
              <div class="ip-main-line">
                <span class="region-code-badge" :class="ipLocationCodeBadgeClass">{{ ipLocationCode }}</span>
                <span class="ip-region-primary">{{ ipLocationPrimaryRegionText }}</span>
              </div>
              <div class="ip-sub-line">
                <span class="ip-region">{{ ipLocationDisplayText }}</span>
                <button class="ip-refresh-btn" type="button" @click="triggerIpLocationRefresh" :disabled="ipLocationLoading">
                  <IconRefresh :size="14" :class="{ spinning: ipLocationLoading }" />
                  <span>{{ ipLocationLoading ? $t('dashboard.refreshing') : $t('common.refresh') }}</span>
                </button>
              </div>
              <div class="ip-status-row">
                <span class="status-dot" aria-hidden="true"></span>
                <span>{{ $t('dashboard.smoothStatusNormal') }}</span>
              </div>
            </div>


            <div class="ip-service-reference" v-if="ipLocationServiceCatalog.length">
              <div class="service-reference-title">
                <span>{{ $t('dashboard.serviceReference') }}</span>
                <span class="info-tooltip" tabindex="0" role="button" :aria-label="$t('dashboard.serviceReferenceHint')">
                  <IconHelpCircle :size="14" />
                  <span class="info-tooltip-content">{{ $t('dashboard.serviceReferenceHint') }}</span>
                </span>
              </div>
              <div class="service-reference-tags" role="list" :aria-label="$t('dashboard.serviceReferenceAria')">
                <div
                  v-for="service in ipLocationServiceCatalog"
                  :key="`ip-service-${service.key}`"
                  class="service-reference-item"
                  :class="{ active: isIpServiceReferenced(service.key) }"
                  role="listitem"
                  :title="`${service.label} · ${isIpServiceReferenced(service.key) ? $t('dashboard.serviceAvailableInRegion') : $t('dashboard.serviceNotInRegion')}`"
                >
                  <span class="service-reference-tile">
                    <img class="service-reference-icon" :src="service.icon" :alt="service.label" loading="lazy" />
                  </span>
                  <span class="service-reference-label">{{ service.label }}</span>
                </div>
              </div>
            </div>

            <IconChevronRight class="ip-card-arrow" :size="20" />
          </div>
          <div v-else class="ip-location-state">{{ $t('trafficLog.noTrafficData') }}</div>
        </div>
      </div>

      <div class="dashboard-card usage-trend-card" v-if="hasPlan">
        <div class="card-header">
          <h2 class="card-title">{{ $t('trafficLog.title') }}</h2>
        </div>
        <div class="card-body">
          <div v-if="trafficTrendLoading" class="trend-state">{{ $t('trafficLog.loadingTraffic') }}</div>
          <div v-else-if="trafficTrendError" class="trend-state">{{ $t('trafficLog.errorLoadingTraffic') }}</div>
          <div v-else-if="!trafficTrendData.length" class="trend-state">{{ $t('trafficLog.noTrafficData') }}</div>
          <div v-else ref="trafficTrendChartRef" class="usage-trend-chart"></div>
        </div>
      </div>

    </div>
    <!-- 弹窗组件 -->
    <CommonDialog
        :show-dialog="showPopup"
        :title="$t('invite.withdraw.tip')"
        :content="$t('dashboard.resetDataCycleNotice')"
        cancel-button-i18n-key="profile.cancel"
        confirm-button-i18n-key="profile.iKnow"
        @close="handlePopupClose"
        @confirm="handlePopupConfirm"
    />

  </div>
</div>



  <transition name="modal-fade">
      <div class="modal-overlay traffic-package-overlay traffic-package-modal-overlay" v-if="showTrafficPackageModal" @click="showTrafficPackageModal = false">
        <div class="modal-container traffic-package-container traffic-package-modal-container" @click.stop>
          <div class="modal-card traffic-package-modal-card traffic-package-modal-card-global">
            <div class="modal-header">
              <h3>{{ $t('shop.traffic_package.title') }}</h3>
              <button class="close-button" :aria-label="$t('common.close')" @click="showTrafficPackageModal = false">
                <IconX :size="18" />
              </button>
            </div>
            <div class="modal-body">
              <p class="traffic-package-desc">{{ $t('shop.traffic_package.description') }}</p>
              <div v-if="trafficPackageLoading" class="traffic-package-loading">{{ $t('common.loading') }}</div>
              <div v-else-if="trafficPackagePlans.length === 0" class="traffic-package-empty">{{ $t('shop.no_plans_found') }}</div>
              <div v-else class="traffic-package-list">
                <div class="traffic-package-item" v-for="plan in trafficPackagePlans" :key="`dashboard-traffic-${plan.id}`">
                  <div class="item-title-row">
                    <strong>{{ getTrafficPackageDisplayName(plan) }}</strong>
                    <span class="item-price">{{ currencySymbol }}{{ (normalizeTrafficPackagePrice(plan.onetime_price) / 100).toFixed(2) }}</span>
                  </div>
                  <div class="item-content" v-if="getTrafficPackageContent(plan)">{{ getTrafficPackageContent(plan) }}</div>
                  <button class="confirm-btn buy-btn" :disabled="isTrafficPackageSoldOut(plan)" @click="purchaseTrafficPackage(plan)">
                    {{ isTrafficPackageSoldOut(plan) ? $t('shop.plan.sold_out_btn') : $t('shop.plan.add_quota') }}
                  </button>
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button class="cancel-btn" @click="showTrafficPackageModal = false">
                {{ $t('common.cancel') }}
              </button>
            </div>
          </div>
        </div>
      </div>
  </transition>
  <!-- 重置流量确认弹窗 -->
  <transition name="modal-fade">
    <div class="modal-overlay" v-if="showResetTrafficModal">
      <div class="modal-container">
        <div class="modal-card reset-traffic-modal">
          <div class="modal-header">
            <h3>{{ $t('dashboard.resetTrafficConfirm') }}</h3>
            <button class="close-button" @click="closeResetTrafficModal">×</button>
          </div>
          <div class="modal-body">
            <div class="warning-icon">
              <IconAlertTriangle :size="48"/>
            </div>
            <p class="warning-text">{{ $t('dashboard.resetTrafficDesc') }}</p>
            <p class="note-text">{{ $t('dashboard.resetTrafficWarning') }}</p>
          </div>
          <div class="modal-footer">
            <button class="cancel-btn" @click="closeResetTrafficModal">
              {{ $t('common.cancel') }}
            </button>
            <button
                class="confirm-btn"
                :disabled="resetConfirmCooldown > 0 || isCreatingResetOrder"
                @click="createResetTrafficOrder"
            >
              <template v-if="isCreatingResetOrder">
                <span class="loading-container">
                  <div class="loader-small"></div>
                  <span>{{ $t('common.loading') }}</span>
                </span>
              </template>
              <template v-else>
                {{
                  resetConfirmCooldown > 0 ? `${$t('common.confirm')} (${resetConfirmCooldown})` : $t('common.confirm')
                }}
              </template>
            </button>
          </div>
        </div>
      </div>


    </div>
  </transition>

</template>

<script>
import {
  computed,
  inject,
  nextTick,
  onActivated,
  onBeforeUnmount,
  onDeactivated,
  onMounted,
  onUnmounted,
  reactive,
  ref,
  watch
} from 'vue';
import {useRouter} from 'vue-router';
import {useI18n} from 'vue-i18n';
import {CLIENT_CONFIG, DASHBOARD_CONFIG, isXiaoV2board, SITE_CONFIG} from '@/utils/baseConfig';
import {
  IconAlertTriangle,
  IconBox,
  IconBrandAndroid,
  IconBrandApple,
  IconBrandDebian,
  IconBrandFinder,
  IconBrandGithub,
  IconBrandWindows,
  IconCalendar,
  IconCat,
  IconChevronLeft,
  IconChevronRight,
  IconCoins,
  IconCopy,
  IconCrosshair,
  IconDeviceDesktop,
  IconEye,
  IconEyeOff,
  IconFileText,
  IconHelpCircle,
  IconMoon,
  IconPackage,
  IconQrcode,
  IconRocket,
  IconRouter,
  IconSend,
  IconShare,
  IconShoppingBag,
  IconShoppingCart,
  IconTransferVertical,
  IconUserPlus,
  IconWallet,
  IconWaveSawTool,
  IconWaveSine,
  IconX,
  IconCalendarPlus,
  IconPlus,
  IconRefresh
} from '@tabler/icons-vue';
import CommonDialog from '@/components/popup/CommonDialog.vue';
import InfoCard from '@/components/common/InfoCard.vue';
import {getNotices, getSubscribe, getUserConfig, getUserInfo, getUserStats, setNextPeriod} from '@/api/dashboard';
import { updateRemindSettings as apiUpdateRemind } from '@/api/user';
import { getTrafficLog } from '@/api/trafficLog';
import * as echarts from 'echarts';
import {useToast} from '@/composables/useToast';
import {fetchPlans, submitOrder} from '@/api/shop';
import MarkdownIt from 'markdown-it';
import QRCode from 'qrcode';
import shadowrocketIconImg from '@/assets/images/client-img-ios/shadowrocket.png';
import surgeIconImg from '@/assets/images/client-img-ios/Surge.png';
import stashIconImg from '@/assets/images/client-img-ios/stash.png';
import quantumultIconImg from '@/assets/images/client-img-ios/quantumultx.png';
import singboxIconImg from '@/assets/images/client-img-ios/singbox.png';
import loonIconImg from '@/assets/images/client-img-ios/loon.png';
import v2rayNGIconImg from '@/assets/images/client-img-android/v2rayng.png';
import clashAndroidIconImg from '@/assets/images/client-img-android/clash.png';
import surfboardIconImg from '@/assets/images/client-img-android/surfboard.png';
import clashMetaAndroidIconImg from '@/assets/images/client-img-android/clashmeta.png';
import nekoboxIconImg from '@/assets/images/client-img-android/nekobox.png';
import singboxAndroidIconImg from '@/assets/images/client-img-android/singbox.png';
import hiddifyAndroidIconImg from '@/assets/images/client-img-android/hiddify.png';
import flclashIconImg from '@/assets/images/client-img-windows/flclash.png';
import clashvergeIconImg from '@/assets/images/client-img-windows/clashverge.png';
import clashWindowsIconImg from '@/assets/images/client-img-windows/clash.png';
import nekorayIconImg from '@/assets/images/client-img-windows/nekoray.png';
import singboxWindowsIconImg from '@/assets/images/client-img-windows/singbox.png';
import hiddifyWindowsIconImg from '@/assets/images/client-img-windows/hiddify.png';
import clashXIconImg from '@/assets/images/client-img-macos/clashx.png';
import clashMetaXIconImg from '@/assets/images/client-img-macos/clashmetax.png';
import surgeMacIconImg from '@/assets/images/client-img-macos/Surge.png';
import stashMacIconImg from '@/assets/images/client-img-macos/stash.png';
import quantumultXMacIconImg from '@/assets/images/client-img-macos/quantumultx.png';
import singboxMacIconImg from '@/assets/images/client-img-macos/singbox.png';
import hiddifyMacIconImg from '@/assets/images/client-img-macos/hiddify.png';
import serviceNetflixIcon from '@/assets/images/service-icons/netflix.svg';
import serviceDisneyPlusIcon from '@/assets/images/service-icons/disney-plus.svg';
import serviceYoutubePremiumIcon from '@/assets/images/service-icons/youtube.svg';
import serviceChatgptIcon from '@/assets/images/service-icons/chatgpt.svg';
import serviceClaudeIcon from '@/assets/images/service-icons/claude.svg';
import serviceGoogleIcon from '@/assets/images/service-icons/google.svg';

import {cleanupResources, createTimer} from '@/utils/componentLifecycle';

const md = new MarkdownIt({
  html: true,
  breaks: true,
  linkify: true,
  typographer: true,
});

md.renderer.rules.link_open = function (tokens, idx, options, env, self) {
  const token = tokens[idx];
  const hrefIndex = token.attrIndex('href');
  let href = '';

  if (hrefIndex >= 0) {
    href = token.attrs[hrefIndex][1];
  }

  if (href.includes('#eztheme-btn') || href.includes('class=eztheme-btn') || href.includes('?eztheme-btn')) {
    token.attrs[hrefIndex][1] = href
        .replace('#eztheme-btn', '')
        .replace('class=eztheme-btn', '')
        .replace('?eztheme-btn', '');

    const classIndex = token.attrIndex('class');
    if (classIndex < 0) {
      token.attrPush(['class', 'eztheme-btn']);
    } else {
      const classes = token.attrs[classIndex][1];
      if (!classes.includes('eztheme-btn')) {
        token.attrs[classIndex][1] = classes + ' eztheme-btn';
      }
    }
  }

  return self.renderToken(tokens, idx, options);
};

export default {
  name: 'UserDashboard',
  components: {
    IconBox,
    IconSend,
    IconCalendar,
    IconUserPlus,
    IconShoppingCart,
    IconFileText,
    IconWallet,
    IconBrandApple,
    IconBrandAndroid,
    IconBrandWindows,
    IconBrandDebian,
    IconRouter,
    IconBrandFinder,
      IconTransferVertical,
    IconShare,
    IconChevronLeft,
    IconChevronRight,
    IconCopy,
    IconQrcode,
    IconRocket,
    IconWaveSine,
    IconDeviceDesktop,
    IconCrosshair,
    IconPackage,
    IconMoon,
    IconWaveSawTool,
    IconBrandGithub,
    IconCat,
    IconEyeOff,
    IconShoppingBag,
    IconHelpCircle,
    IconCoins,
    IconEye,
    IconAlertTriangle,
    InfoCard,
    IconX,
    IconCalendarPlus,
    IconPlus,
    CommonDialog
  },
  setup() {
    const {t, locale} = useI18n();
    const router = useRouter();
    const clientConfig = reactive(CLIENT_CONFIG);
    const notices = ref([]);
    const autoRotateNotices = ref(true);
    const userPlan = ref({
      deviceLimit: null,
      aliveIp: 0,
      resetDay: null,
      resetDateTime: null,
      subscriptionQuotaUsed: null,
      subscriptionQuotaRemaining: null,
      packageQuotaRemaining: null,
      expiredAt: null
    });
    const remindExpireSetting = ref(false);
    const remindTrafficSetting = ref(false);
    const autoRenewalEnabled = ref(false);
    const updatingAutoRenewalSetting = ref(false);

        const trafficMetrics = reactive({
      totalTrafficBytes: 0,
      totalUsedBytes: 0,
      totalRemainingBytes: 0,
      subscriptionQuotaTotalBytes: 0,
      subscriptionQuotaUsedBytes: 0,
      subscriptionQuotaRemainingBytes: 0,
      packageQuotaRemainingBytes: 0,
    });

    const trafficTrendChartRef = ref(null);
    const trafficTrendData = ref([]);
    const trafficTrendLoading = ref(false);
    const trafficTrendError = ref(false);
    let trafficTrendChart = null;

    const ipLocationLoading = ref(false);
    const ipLocationError = ref('');
    const ipLocationData = ref(null);
    const ipLocationCache = ref(null);
    const ipLocationDebounceTimer = ref(null);

    const qrCodeLoading = ref(true);
    const showImportSubscription = ref(DASHBOARD_CONFIG.showImportSubscription)

    const languageChangedSignal = inject('languageChangedSignal', ref(0));

    const shadowrocketIcon = shadowrocketIconImg;
    const surgeIcon = surgeIconImg;
    const stashIcon = stashIconImg;
    const quantumultIcon = quantumultIconImg;
    const singboxIcon = singboxIconImg;
    const loonIcon = loonIconImg;

    const v2rayNGIcon = v2rayNGIconImg;
    const clashAndroidIcon = clashAndroidIconImg;
    const surfboardIcon = surfboardIconImg;
    const clashMetaAndroidIcon = clashMetaAndroidIconImg;
    const nekoboxIcon = nekoboxIconImg;
    const singboxAndroidIcon = singboxAndroidIconImg;
    const hiddifyAndroidIcon = hiddifyAndroidIconImg;

    const flclashIcon = flclashIconImg;
    const clashvergeIcon = clashvergeIconImg;
    const clashWindowsIcon = clashWindowsIconImg;
    const nekorayIcon = nekorayIconImg;
    const singboxWindowsIcon = singboxWindowsIconImg;
    const hiddifyWindowsIcon = hiddifyWindowsIconImg;

    const clashXIcon = clashXIconImg;
    const clashMetaXIcon = clashMetaXIconImg;
    const surgeMacIcon = surgeMacIconImg;
    const stashMacIcon = stashMacIconImg;
    const quantumultXMacIcon = quantumultXMacIconImg;
    const singboxMacIcon = singboxMacIconImg;
    const hiddifyMacIcon = hiddifyMacIconImg;

    const userStats = reactive({
      remainingTraffic: '',
      remainingDays: '',
      accountBalance: '0.00',
      pendingOrders: 0,
      pendingTickets: 0,
      userEmail: '',
      isRemainingDaysPermanent: false
    });
    const userBalance = ref('0.00');
    const currencySymbol = ref('$');
    const hasPlan = ref(true);
    const currentNoticeIndex = ref(0);
    const showNoticeDetails = ref(false);
    const showImportCard = ref(false);
    const showQrCode = ref(false);
    const {showToast} = useToast();
    const qrCodeUrl = ref('');

    //提前开启下月
    const allowNewPeriod = ref('')

    const platforms = [
      {id: 'ios', icon: 'IconBrandApple'},
      {id: 'android', icon: 'IconBrandAndroid'},
      {id: 'windows', icon: 'IconBrandWindows'},
      {id: 'macos', icon: 'IconBrandFinder'}
    ];

    const activePlatform = ref(detectUserPlatform());

    function detectUserPlatform() {
      const userAgent = navigator.userAgent || navigator.vendor || window.opera;

      if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) {
        return 'ios';
      }

      if (/android/i.test(userAgent)) {
        return 'android';
      }

      if (/Mac/.test(userAgent)) {
        return 'macos';
      }

      return 'windows';
    }

    const loading = reactive({
      userInfo: true,
      userStats: true,
      notices: true,
      userPlan: true,
      subscribe: true
    });

    watch(() => locale.value, async () => {
      if (userPlan.value.isExpireDatePermanent) {
        userPlan.value.expireDate = t('dashboard.permanent');
      }

      if (ipLocationError.value) {
        ipLocationError.value = t('trafficLog.errorLoadingTraffic');
      }

      await Promise.allSettled([
        fetchSubscribe(true),
        fetchNotices(true),
        fetchTrafficTrend()
      ]);
    });


    const goToShop = () => {
      router.push('/shop');
    };

    const userPlanId = ref(null);

    const showResetTrafficModal = ref(false);
    const showTrafficPackageModal = ref(false);
    const trafficPackageLoading = ref(false);
    const trafficPackagePlans = ref([]);
    const resetConfirmCooldown = ref(0);
    const resetConfirmTimer = ref(null);
    const isCreatingResetOrder = ref(false);

    const openResetTrafficModal = () => {
      showResetTrafficModal.value = true;
      resetConfirmCooldown.value = 3;
      resetConfirmTimer.value = setInterval(() => {
        if (resetConfirmCooldown.value > 0) {
          resetConfirmCooldown.value--;
        } else {
          clearInterval(resetConfirmTimer.value);
        }
      }, 1000);
    };
    const showPopup = ref(false);
    const handlePopupClose = () => {

      showPopup.value = false;
      // console.log(showPopup.value,'111111111')
      // nextPeriod()

    };
    const handlePopupConfirm = async () => {
      try {
        const response = await setNextPeriod()
        console.log(response)
        if (response.data) {
          await fetchSubscribe()
          showToast(t('dashboard.nextPeriodSuccess'), 'success');
          showPopup.value = false;
        }
      } catch (error) {
        console.error('提前开启下月失败:', error);
        showToast(t('dashboard.nextPeriodError'), 'error');
      }

    }

    const closeResetTrafficModal = () => {
      showResetTrafficModal.value = false;
      if (resetConfirmTimer.value) {
        clearInterval(resetConfirmTimer.value);
      }
    };

    const createResetTrafficOrder = async () => {
      if (resetConfirmCooldown.value > 0) {
        return;
      }

      console.log('开始请求：设置 isCreatingResetOrder = true');
      isCreatingResetOrder.value = true;

      try {
        if (!userPlanId.value) {
          showToast(t('common.error_occurred'), 'error');
          console.log('无套餐ID：重置 isCreatingResetOrder = false');
          isCreatingResetOrder.value = false;
          return;
        }

        console.log('正在调用API，当前状态：', isCreatingResetOrder.value);
        const response = await submitOrder({
          plan_id: userPlanId.value,
          period: 'reset_price'
        });

        if (response && response.data) {
          console.log('API请求成功');
          showToast(t('dashboard.resetTrafficSuccess'), 'success');

          closeResetTrafficModal();

          router.push({
            path: '/payment',
            query: {
              trade_no: response.data
            }
          });
        }
      } catch (error) {
        console.error('创建重置流量订单失败:', error);
        showToast(error.message || t('common.error_occurred'), 'error');
      } finally {
        console.log('请求结束：重置 isCreatingResetOrder = false');
        isCreatingResetOrder.value = false;
      }
    };

    const fetchUserInfo = async () => {
      if (loading.userInfo === false && Object.keys(userPlan.value).length > 0) return;

      loading.userInfo = true;
      try {
        const response = await getUserInfo();
        if (response.data) {
          const info = response.data;

          userPlanId.value = info.plan_id;

          hasPlan.value = info.plan_id !== null && info.plan_id !== undefined;

          if (info.email) {
            userStats.userEmail = info.email;
          }
          if (info.balance !== undefined) {
            userBalance.value = info.balance;
            updateAccountBalanceDisplay();
          }
          remindExpireSetting.value = !!info.remind_expire;
          remindTrafficSetting.value = !!info.remind_traffic;
          autoRenewalEnabled.value = !!info.auto_renewal;
          if (info.expired_at) {
            userPlan.value.expireDate = formatDate(info.expired_at);
            userPlan.value.expiredAt = Number(info.expired_at);
            userPlan.value.isExpireDatePermanent = false;

            const now = new Date();
            const expiredDate = new Date(info.expired_at * 1000);
            const diffTime = expiredDate - now;

            if (diffTime <= 0) {
              userStats.remainingDays = '0';
              userStats.isRemainingDaysPermanent = false;
            } else {
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
              userStats.remainingDays = `${diffDays}`;
              userStats.isRemainingDaysPermanent = false;
            }
          } else {
            userPlan.value.expireDate = null;
            userPlan.value.expiredAt = null;
            userPlan.value.isExpireDatePermanent = true;
            userStats.remainingDays = null;
            userStats.isRemainingDaysPermanent = true;
          }
        }
      } catch (error) {
        console.error('获取用户信息失败:', error);
      } finally {
        loading.userInfo = false;
      }
    };

    const updateAutoRenewalSetting = async () => {
      const originalValue = !autoRenewalEnabled.value;
      updatingAutoRenewalSetting.value = true;
      try {
        await apiUpdateRemind({
          remind_expire: remindExpireSetting.value ? 1 : 0,
          remind_traffic: remindTrafficSetting.value ? 1 : 0,
          auto_renewal: autoRenewalEnabled.value ? 1 : 0,
        });
        showToast(t('profile.updateSuccess'), 'success');
      } catch (error) {
        autoRenewalEnabled.value = originalValue;
        showToast(t('profile.updateError'), 'error');
      } finally {
        updatingAutoRenewalSetting.value = false;
      }
    };

    const isExpiringSoon = computed(() => {
      if (userStats.isRemainingDaysPermanent) return false;

      const days = parseInt(userStats.remainingDays, 10);
      return !isNaN(days) && days > 0 && days <= 7;
    });

    const hasIOSClients = computed(() => {
      return clientConfig.showShadowrocket ||
          clientConfig.showSurge ||
          clientConfig.showStash ||
          clientConfig.showQuantumultX ||
          clientConfig.showHiddifyIOS ||
          clientConfig.showSingboxIOS ||
          clientConfig.showLoon;
    });

    const hasAndroidClients = computed(() => {
      return clientConfig.showV2rayNG ||
          clientConfig.showClashAndroid ||
          clientConfig.showSurfboard ||
          clientConfig.showClashMetaAndroid ||
          clientConfig.showNekobox ||
          clientConfig.showSingboxAndroid ||
          clientConfig.showHiddifyAndroid;
    });

    const hasWindowsClients = computed(() => {
      return clientConfig.showClashWindows ||
          clientConfig.showFlClashWindows ||
          clientConfig.showClashVergeWindows ||
          clientConfig.showNekoray ||
          clientConfig.showSingboxWindows ||
          clientConfig.showHiddifyWindows;
    });

    const hasMacOSClients = computed(() => {
      return clientConfig.showClashX ||
          clientConfig.showFlClashMac ||
          clientConfig.showClashVergeMac ||
          clientConfig.showClashMetaX ||
          clientConfig.showSurgeMac ||
          clientConfig.showStashMac ||
          clientConfig.showQuantumultXMac ||
          clientConfig.showSingboxMac ||
          clientConfig.showHiddifyMac;
    });

    const isExpired = computed(() => {
      if (userStats.isRemainingDaysPermanent) return false;

      const days = parseInt(userStats.remainingDays, 10);
      return !isNaN(days) && days <= 0;
    });

    const isPlanExpired = computed(() => {
      if (userPlan.value.isExpireDatePermanent) return false;
      const expiredAt = Number(userPlan.value.expiredAt || 0);
      if (!expiredAt) return false;
      return expiredAt * 1000 <= Date.now();
    });

    const subscriptionStatus = computed(() => {
      if (isPlanExpired.value) return 'expired';
      if (userPlan.value.isExpireDatePermanent) return 'active';

      const expiredAt = Number(userPlan.value.expiredAt || 0);
      if (!expiredAt) return 'active';

      const diffMs = expiredAt * 1000 - Date.now();
      return diffMs <= 7 * 24 * 60 * 60 * 1000 ? 'expiring' : 'active';
    });

    const subscriptionStatusLabel = computed(() => {
      const currentLocale = locale.value;
      void currentLocale;
      if (subscriptionStatus.value === 'expired') return t('dashboard.subscriptionStatus.expired');
      if (subscriptionStatus.value === 'expiring') return t('dashboard.subscriptionStatus.expiring');
      return t('dashboard.subscriptionStatus.active');
    });

    const primaryPlanActionLabel = computed(() => {
      const currentLocale = locale.value;
      void currentLocale;
      if (subscriptionStatus.value === 'active') return t('dashboard.planAction.manageSubscription');
      if (subscriptionStatus.value === 'expired') return t('dashboard.planAction.restoreNow');
      return t('dashboard.planAction.renewNow');
    });

    const planExpireMetaText = computed(() => {
      const currentLocale = locale.value;
      void currentLocale;
      if (subscriptionStatus.value === 'expired') {
        return t('dashboard.expiredOnDate', { date: userPlan.value.expireDate || '-' });
      }
      return `${t('dashboard.expiryDate')} · ${userPlan.value.expireDate || t('dashboard.permanent')}`;
    });

    const secondaryPlanActionLabel = computed(() => {
      const currentLocale = locale.value;
      void currentLocale;
      if (subscriptionStatus.value === 'expired') return t('dashboard.planAction.reselectPlan');
      if (subscriptionStatus.value === 'expiring') return t('dashboard.planAction.manageSubscription');
      return t('dashboard.planAction.renew');
    });

    const primaryActionClass = computed(() => {
      if (subscriptionStatus.value === 'active') return 'theme';
      return 'primary';
    });

    const secondaryActionClass = computed(() => {
      if (secondaryPlanActionLabel.value === t('dashboard.planAction.manageSubscription')) return 'theme';
      return 'subtle';
    });

    const handlePrimaryPlanAction = () => {
      if (subscriptionStatus.value === 'active') {
        goToShop();
        return;
      }
      renewPlan();
    };

    const handleSecondaryPlanAction = () => {
      if (subscriptionStatus.value === 'active') {
        renewPlan();
        return;
      }
      goToShop();
    };

    const isLowTraffic = computed(() => {
      const remainingMatch = userStats.remainingTraffic.match(/(\d+(\.\d+)?)\s*([KMGT]?B)/i);

      if (!userPlan.value || !userPlan.value.totalTraffic || !remainingMatch) return false;

      const totalMatch = userPlan.value.totalTraffic.match(/(\d+(\.\d+)?)\s*([KMGT]?B)/i);
      if (!totalMatch) return false;

      const remainingValue = parseFloat(remainingMatch[1]);
      const remainingUnit = remainingMatch[3].toUpperCase();

      const totalValue = parseFloat(totalMatch[1]);
      const totalUnit = totalMatch[3].toUpperCase();

      const unitToBytes = {
        'B': 1,
        'KB': 1024,
        'MB': 1024 * 1024,
        'GB': 1024 * 1024 * 1024,
        'TB': 1024 * 1024 * 1024 * 1024
      };

      const remainingBytes = remainingValue * unitToBytes[remainingUnit];
      const totalBytes = totalValue * unitToBytes[totalUnit];

      if (totalBytes === 0) return false;

      if (remainingBytes === 0) return false;

      const percentage = (remainingBytes / totalBytes) * 100;

      return percentage > 0 && percentage <= 10;
    });

    const isTrafficDepleted = computed(() => {
      const remainingMatch = userStats.remainingTraffic.match(/(\d+(\.\d+)?)\s*([KMGT]?B)/i);

      if (!remainingMatch) return false;

      const remainingValue = parseFloat(remainingMatch[1]);
      const remainingUnit = remainingMatch[3].toUpperCase();

      if (remainingValue === 0) return true;
      if (remainingUnit === 'B' && remainingValue < 10) return true;
      if (remainingUnit === 'KB' && remainingValue < 0.01) return true;

      return false;
    });

    const showResetTrafficButton = computed(() => {
      return isLowTraffic.value || isTrafficDepleted.value;
    });

    const showRenewPlanButton = computed(() => {
      return true;
    });


    const toNumberOrNull = (value) => {
      if (value === null || value === undefined || value === '') return null;
      const num = Number(value);
      return Number.isFinite(num) ? num : null;
    };

    const getSubscribeTrafficMetrics = (subscribe) => {
      const totalTrafficBytes =
        toNumberOrNull(subscribe.transfer_enable) ??
        toNumberOrNull(subscribe.subscription_quota_total_bytes) ??
        toNumberOrNull(subscribe.base_quota_bytes) ??
        0;

      const usedTrafficBytes =
        toNumberOrNull(subscribe.total_used_bytes) ??
        toNumberOrNull(subscribe.used_bytes) ??
        (
          (toNumberOrNull(subscribe.u) ?? 0) +
          (toNumberOrNull(subscribe.d) ?? 0)
        );

      const remainingTrafficBytes =
        toNumberOrNull(subscribe.total_remaining_bytes) ??
        Math.max(totalTrafficBytes - usedTrafficBytes, 0);

      return {
        totalTrafficBytes: Math.max(totalTrafficBytes, 0),
        remainingTrafficBytes: Math.max(remainingTrafficBytes, 0)
      };
    };

    const fetchSubscribe = async (force = false) => {
      // 如果showResetTrafficButton为true，强制执行（跳过缓存逻辑）
      // if (showResetTrafficButton.value) {
      //   // 强制执行，但仍要防止并发
      //   if (loading.subscribe === true) return;
      // } else {
      // 正常的缓存逻辑
      if (!force && loading.subscribe === false && userPlan.value.subscribeUrl) return;
      // }

      loading.subscribe = true;
      try {
        const response = await getSubscribe();
        allowNewPeriod.value = String(response.data.allow_new_period ?? '0');
        if (response.data) {
          const subscribe = response.data;
          const { totalTrafficBytes, remainingTrafficBytes } = getSubscribeTrafficMetrics(subscribe);
          if (subscribe.plan && subscribe.plan.name) {
            userPlan.value.name = subscribe.plan.name;
          }
          if (subscribe.plan && subscribe.plan.id) {
            userPlanId.value = subscribe.plan.id;
          }
          if (subscribe.expired_at) {
            userPlan.value.expireDate = formatDate(subscribe.expired_at);
            userPlan.value.expiredAt = Number(subscribe.expired_at);
            userPlan.value.isExpireDatePermanent = false;

            const now = new Date();
            const expiredDate = new Date(subscribe.expired_at * 1000);
            const diffTime = expiredDate - now;

            if (diffTime <= 0) {
              userStats.remainingDays = '0';
              userStats.isRemainingDaysPermanent = false;
            } else {
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
              userStats.remainingDays = `${diffDays}`;
              userStats.isRemainingDaysPermanent = false;
            }
          } else {
            userPlan.value.expireDate = null;
            userPlan.value.expiredAt = null;
            userPlan.value.isExpireDatePermanent = true;
            userStats.remainingDays = null;
            userStats.isRemainingDaysPermanent = true;
          }
          userPlan.value.totalTraffic = formatTraffic(totalTrafficBytes);
          userStats.remainingTraffic = formatTraffic(remainingTrafficBytes);

          const subscriptionQuotaUsedBytes =
            toNumberOrNull(subscribe.subscription_quota_used_bytes) ??
            toNumberOrNull(subscribe.monthly_used_bytes);
          const subscriptionQuotaTotalBytes =
            toNumberOrNull(subscribe.subscription_quota_total_bytes) ??
            toNumberOrNull(subscribe.base_quota_bytes);
          const subscriptionQuotaRemainingBytes =
            toNumberOrNull(subscribe.subscription_quota_remaining_bytes) ??
            toNumberOrNull(subscribe.monthly_remaining_bytes);
          const packageQuotaRemainingBytes =
            toNumberOrNull(subscribe.quota_package_remaining_bytes) ??
            toNumberOrNull(subscribe.package_remaining_bytes);

          userPlan.value.subscriptionQuotaUsed =
            subscriptionQuotaUsedBytes === null ? null : formatTraffic(Math.max(subscriptionQuotaUsedBytes, 0));
          userPlan.value.subscriptionQuotaRemaining =
            subscriptionQuotaRemainingBytes === null ? null : formatTraffic(Math.max(subscriptionQuotaRemainingBytes, 0));
          userPlan.value.packageQuotaRemaining =
            packageQuotaRemainingBytes === null ? null : formatTraffic(Math.max(packageQuotaRemainingBytes, 0));

          trafficMetrics.totalTrafficBytes = totalTrafficBytes;
          trafficMetrics.totalUsedBytes = Math.max(totalTrafficBytes - remainingTrafficBytes, 0);
          trafficMetrics.totalRemainingBytes = remainingTrafficBytes;
          trafficMetrics.subscriptionQuotaTotalBytes = Math.max(subscriptionQuotaTotalBytes ?? 0, 0);
          trafficMetrics.subscriptionQuotaUsedBytes = Math.max(subscriptionQuotaUsedBytes ?? 0, 0);
          trafficMetrics.subscriptionQuotaRemainingBytes = Math.max(subscriptionQuotaRemainingBytes ?? 0, 0);
          trafficMetrics.packageQuotaRemainingBytes = Math.max(packageQuotaRemainingBytes ?? 0, 0);

          const resetDay = subscribe.reset_day ?? subscribe.plan?.reset_day;
          if (resetDay) {
            userPlan.value.resetDay = resetDay;
          }
          userPlan.value.resetDateTime = getNextResetDateTime(subscribe);
          if (subscribe.subscribe_url) {
            userPlan.value.subscribeUrl = subscribe.subscribe_url;
          }

          if (subscribe.device_limit !== undefined) {
            userPlan.value.deviceLimit = subscribe.device_limit;
          }
          if (subscribe.alive_ip !== undefined) {
            userPlan.value.aliveIp = subscribe.alive_ip;
          }

          if (subscribe.expired_at) {
            const now = new Date();
            const expiredDate = new Date(subscribe.expired_at * 1000);
            const diffTime = expiredDate - now;

            if (diffTime <= 0) {
              userStats.remainingDays = '0';
              userStats.isRemainingDaysPermanent = false;
            } else {
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
              userStats.remainingDays = `${diffDays}`;
              userStats.isRemainingDaysPermanent = false;
            }
          } else {
            userStats.remainingDays = null;
            userStats.isRemainingDaysPermanent = true;
          }
        }
      } catch (error) {
        console.error('获取订阅信息失败:', error);
      } finally {
        loading.subscribe = false;
      }
    };

    const fetchNotices = async (force = false) => {
      if (!force && loading.notices === false && notices.value.data && notices.value.data.length > 0) return;

      loading.notices = true;
      try {
        const response = await getNotices();
        if (response && response.data) {
          notices.value = response;

          checkForPopupNotices();
        }
      } catch (error) {
      } finally {
        loading.notices = false;
      }
    };

    const checkForPopupNotices = () => {
      if (!notices.value || !notices.value.data || notices.value.data.length === 0) return;

      const popupNoticeIndex = notices.value.data.findIndex(notice =>
          notice.tags && Array.isArray(notice.tags) && notice.tags.includes('\u5f39\u7a97')
      );

      if (popupNoticeIndex !== -1) {
        const noticeId = notices.value.data[popupNoticeIndex].id;
        const popupShownKey = `popup_notice_shown_${noticeId}`;

        if (!sessionStorage.getItem(popupShownKey)) {
          currentNoticeIndex.value = popupNoticeIndex;
          showNoticeDetails.value = true;
          sessionStorage.setItem(popupShownKey, 'true');
          nextTick(() => {
            updateModalHeight();
          });
        }
      }
    };

    const fetchUserStats = async () => {
      if (loading.userStats === false && userStats.remainingTraffic !== '0 GB') return;

      loading.userStats = true;
      try {
        const response = await getUserStats();
        if (response.data && Array.isArray(response.data) && response.data.length >= 2) {
          const stats = response.data;
          userStats.pendingOrders = stats[0];
          userStats.pendingTickets = stats[1];
        }
      } catch (error) {
        console.error('获取统计数据失败:', error);
      } finally {
        loading.userStats = false;
      }
    };

    const formatTraffic = (bytes) => {
      if (bytes === 0) return '0 B';
      const k = 1024;
      const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const formatPackageRemaining = (bytes) => {
      const gb = Math.max(bytes || 0, 0) / (1024 ** 3);
      return `${gb.toFixed(2)} GB`;
    };

    const normalizeTrafficPackagePrice = (value) => {
      const parsed = Number(value);
      return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
    };


    const getPlanListFromResponse = (response) => {
      if (Array.isArray(response?.data)) return response.data;
      if (Array.isArray(response?.data?.data)) return response.data.data;
      return [];
    };

    const getTrafficPackageDisplayName = (plan) => {
      const name = String(plan?.name || '').trim();
      if (!name) return t('shop.traffic_package.entry');
      if (/^data\s*credit$/i.test(name)) return t('shop.traffic_package.entry');
      return name;
    };

    const getTrafficPackageContent = (plan) => {
      const raw = plan?.content;
      if (!raw) return '';
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const enabled = parsed.filter((item) => item && item.support !== false).map((item) => item.feature).filter(Boolean);
          return enabled.slice(0, 2).join(' · ');
        }
      } catch (_) {
        // non-json content
      }
      const plain = String(raw).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
      const displayName = getTrafficPackageDisplayName(plan);
      if (!plain) return '';
      if (plain.toLowerCase() === displayName.toLowerCase()) return '';
      return plain;
    };


    const hasValidOneTimePrice = (plan) => {
      const raw = plan?.onetime_price;
      if (raw === null || raw === undefined || raw === '') {
        return false;
      }
      const price = Number(raw);
      return Number.isFinite(price) && price >= 0;
    };

    const isTrafficPackageSoldOut = (plan) => {
      const raw = plan?.capacity_limit;
      if (raw === null || raw === undefined || raw === '') {
        return false;
      }
      const capacity = Number(raw);
      return Number.isFinite(capacity) && capacity === 0;
    };

    const openTrafficPackageModal = async () => {
      showTrafficPackageModal.value = true;
      trafficPackageLoading.value = true;
      try {
        const response = await fetchPlans(locale.value);
        const list = getPlanListFromResponse(response);
        trafficPackagePlans.value = list.filter((plan) => hasValidOneTimePrice(plan));
      } catch (error) {
        trafficPackagePlans.value = [];
        showToast(t('shop.failed_to_fetch_plan'), 'error');
      } finally {
        trafficPackageLoading.value = false;
      }
    };

    const purchaseTrafficPackage = (plan) => {
      if (isTrafficPackageSoldOut(plan)) {
        showToast(t('shop.plan.stock.sold_out'), 'error');
        return;
      }
      showTrafficPackageModal.value = false;
      router.push({
        path: '/order-confirm',
        query: {
          id: plan.id,
          period: 'onetime_price'
        }
      });
    };

    const hasPendingItems = computed(() => {
      return userStats.pendingOrders > 0;
    });

    const goToOrders = () => {
      router.push('/billing?tab=orders');
    };

    const prevNotice = () => {
      if (!notices.value?.data?.length) return;
      if (currentNoticeIndex.value > 0) {
        currentNoticeIndex.value--;
      } else {
        currentNoticeIndex.value = notices.value.data.length - 1;
      }
    };

    const nextNotice = () => {
      if (!notices.value?.data?.length) return;
      if (currentNoticeIndex.value < notices.value.data.length - 1) {
        currentNoticeIndex.value++;
      } else {
        currentNoticeIndex.value = 0;
      }
    };

    const goToNotice = (index) => {
      if (!notices.value?.data?.length) return;
      currentNoticeIndex.value = Math.max(0, Math.min(index, notices.value.data.length - 1));
    };

    const noticeBackgroundStyle = (notice) => {
      if (!notice?.img_url) return {};
      return {
        backgroundImage: `url(${notice.img_url})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      };
    };

    const showNoticeModal = () => {
      showNoticeDetails.value = true;
      nextTick(() => {
        updateModalHeight();
      });
    };

    const closeNoticeModal = () => {
      showNoticeDetails.value = false;
    };

    const formatDate = (dateString) => {
      if (!dateString) return '';
      const date = new Date(dateString * 1000);
      return date.toLocaleDateString();
    };

    const formatResetDateTime = (date) => {
      if (!(date instanceof Date) || Number.isNaN(date.getTime())) return null;
      const localeValue = locale.value || 'en-US';
      const formatter = new Intl.DateTimeFormat(localeValue, {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
      return formatter.format(date);
    };

    const parseResetTimestamp = (value) => {
      if (value === null || value === undefined || value === '') return null;

      if (value instanceof Date) {
        return Number.isNaN(value.getTime()) ? null : value;
      }

      const numeric = Number(value);
      if (Number.isFinite(numeric) && numeric > 0) {
        const timestampMs = numeric > 1e12 ? numeric : numeric * 1000;
        const date = new Date(timestampMs);
        return Number.isNaN(date.getTime()) ? null : date;
      }

      if (typeof value === 'string') {
        const normalized = value.trim().replace(/-/g, '/');
        const date = new Date(normalized);
        if (!Number.isNaN(date.getTime())) {
          return date;
        }
      }

      return null;
    };

    const getNextResetDateTime = (subscribe) => {
      const expiredAtDate = parseResetTimestamp(subscribe?.expired_at);
      const resetDayValue = Number(subscribe?.reset_day ?? subscribe?.plan?.reset_day);
      const effectiveResetDay = Number.isFinite(resetDayValue) && resetDayValue > 0
        ? resetDayValue
        : (expiredAtDate ? expiredAtDate.getDate() : null);

      if (!Number.isFinite(effectiveResetDay) || effectiveResetDay <= 0) {
        return null;
      }

      const now = new Date();

      const buildMonthlyDate = (year, month, day, hour, minute) => {
        const maxDay = new Date(year, month + 1, 0).getDate();
        return new Date(year, month, Math.min(day, maxDay), hour, minute, 0);
      };

      if (expiredAtDate) {
        const resetHour = expiredAtDate.getHours();
        const resetMinute = expiredAtDate.getMinutes();

        let candidate = buildMonthlyDate(now.getFullYear(), now.getMonth(), effectiveResetDay, resetHour, resetMinute);
        while (candidate <= now) {
          candidate = buildMonthlyDate(candidate.getFullYear(), candidate.getMonth() + 1, effectiveResetDay, resetHour, resetMinute);
        }

        if (candidate > expiredAtDate) {
          candidate = buildMonthlyDate(expiredAtDate.getFullYear(), expiredAtDate.getMonth(), effectiveResetDay, resetHour, resetMinute);
          if (candidate > expiredAtDate) {
            candidate = buildMonthlyDate(candidate.getFullYear(), candidate.getMonth() - 1, effectiveResetDay, resetHour, resetMinute);
          }
        }

        return formatResetDateTime(candidate);
      }

      const resetHourRaw = subscribe?.reset_hour ?? subscribe?.plan?.reset_hour;
      const resetMinuteRaw = subscribe?.reset_minute ?? subscribe?.plan?.reset_minute;
      const resetHour = Number.isFinite(Number(resetHourRaw)) ? Number(resetHourRaw) : 0;
      const resetMinute = Number.isFinite(Number(resetMinuteRaw)) ? Number(resetMinuteRaw) : 0;
      let candidate = buildMonthlyDate(now.getFullYear(), now.getMonth(), effectiveResetDay, resetHour, resetMinute);
      if (candidate <= now) {
        candidate = buildMonthlyDate(candidate.getFullYear(), candidate.getMonth() + 1, effectiveResetDay, resetHour, resetMinute);
      }
      return formatResetDateTime(candidate);
    };

    const updateQRCodeUrl = () => {
      if (userPlan.value.subscribeUrl) {
        qrCodeLoading.value = true;
        try {
          QRCode.toDataURL(userPlan.value.subscribeUrl, {
            width: 200,
            margin: 2,
            color: {
              dark: '#000000',
              light: '#ffffff'
            }
          })
              .then(url => {
                qrCodeUrl.value = url;
                qrCodeLoading.value = false;
              })
              .catch(err => {
                console.error('二维码生成失败:', err);
                qrCodeLoading.value = false;
                showToast(t('dashboard.qrCodeGenerationFailed'), 'error', 3000);
              });
        } catch (error) {
          console.error('生成二维码失败:', error);
          qrCodeLoading.value = false;
          showToast(t('dashboard.qrCodeGenerationFailed'), 'error', 3000);
        }
      }
    };

    const qrCodeLoaded = () => {
      qrCodeLoading.value = false;
    };

    const copySubscription = () => {
      if (userPlan.value.subscribeUrl) {
        const copyWithAPI = () => {
          navigator.clipboard.writeText(userPlan.value.subscribeUrl)
              .then(() => {
                showToast(t('dashboard.subscriptionCopied'), 'success', 3000);
              })
              .catch(() => {
                showToast(t('dashboard.copyFailed'), 'error', 3000);
              });
        };

        const copyWithFallback = () => {
          try {
            const textarea = document.createElement('textarea');
            textarea.value = userPlan.value.subscribeUrl;
            textarea.style.position = 'fixed';
            textarea.style.left = '0';
            textarea.style.top = '0';
            textarea.style.opacity = '0';
            document.body.appendChild(textarea);
            textarea.focus();
            textarea.select();

            const successful = document.execCommand('copy');
            document.body.removeChild(textarea);

            if (successful) {
              showToast(t('dashboard.subscriptionCopied'), 'success', 3000);
            } else {
              showToast(t('dashboard.copyFailed'), 'error', 3000);
            }
          } catch (err) {
            console.error('使用后备方法复制失败:', err);
            showToast(t('dashboard.copyFailed'), 'error', 3000);
          }
        };

        if (navigator.clipboard) {
          copyWithAPI();
        } else {
          copyWithFallback();
        }
      }
    };

    const importToClient = (clientType) => {
      if (!userPlan.value.subscribeUrl) {
        showToast(t('dashboard.noSubscription'), 'error', 3000);
        return;
      }

      const subscribeUrl = userPlan.value.subscribeUrl;
      const siteName = SITE_CONFIG.siteName || t('dashboard.defaultSubscriptionName');

      let url = '';
      let shouldUseCurrentWindow = true;

      try {
        switch (clientType) {
          case 'shadowrocket':
            url = `shadowrocket://add/sub://${window.btoa(subscribeUrl).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')}?remark=${encodeURIComponent(siteName)}`;
            break;
          case 'surge':
          case 'surge-mac':
            url = `surge:///install-config?url=${encodeURIComponent(subscribeUrl)}&name=${encodeURIComponent(siteName)}`;
            break;
          case 'stash':
          case 'stash-mac':
            url = `stash://install-config?url=${encodeURIComponent(subscribeUrl)}&name=${encodeURIComponent(siteName)}`;
            break;
          case 'quantumultx':
          case 'quantumultx-mac':
            url = `quantumult-x:///update-configuration?remote-resource=${encodeURI(JSON.stringify({server_remote: [`${subscribeUrl}, tag=${encodeURIComponent(siteName)}`,],}))}`;
            break;
          case 'loon':
            url = `loon://import?nodelist=${encodeURIComponent(subscribeUrl)}&name=${encodeURIComponent(siteName)}`;
            break;
          case 'v2rayng':
            url = `v2rayng://install-sub?url=${encodeURIComponent(subscribeUrl)}#${encodeURIComponent(siteName)}`;
            break;
          case 'clash':
          case 'clash-android':
          case 'clash-meta-android':
          case 'flclash':
          case 'clashverge':
          case 'nekobox':
          case 'nekoray':
          case 'clashx':
          case 'clashx-meta':
            url = `clash://install-config?url=${encodeURIComponent(subscribeUrl)}&name=${encodeURIComponent(siteName)}`;
            break;
          case 'surfboard':
            url = `surfboard:///install-config?url=${encodeURIComponent(subscribeUrl)}&name=${encodeURIComponent(siteName)}`;
            break;
          case 'singbox-ios':
          case 'singbox-android':
          case 'singbox-windows':
          case 'singbox-macos':
            url = `sing-box://import-remote-profile?url=${encodeURIComponent(subscribeUrl)}#${encodeURIComponent(siteName)}`;
            break;
          case 'hiddify-android':
          case 'hiddify-windows':
          case 'hiddify-macos':
          case 'hiddify-ios':
            url = `hiddify://import/${subscribeUrl}#${encodeURIComponent(siteName)}`;
            break;
          default:
            navigator.clipboard.writeText(subscribeUrl)
              .then(() => {
                showToast(t('dashboard.subscriptionCopied'), 'success', 3000);
              })
              .catch(() => {
                showToast(t('dashboard.copyFailed'), 'error', 3000);
              });
            return;
        }

        if (url) {
          if (shouldUseCurrentWindow) {
            window.location.href = url;
          } else {
            window.open(url, '_blank');
          }
        }
      } catch (error) {
        console.error('导入客户端失败:', error);
      }
    };

    const toggleImportCard = () => {
      showImportCard.value = !showImportCard.value;
      if (showImportCard.value) {
        nextTick(() => {
          setTimeout(() => {
            const importCard = document.querySelector('.import-card');
            if (importCard) {
              importCard.scrollIntoView({
                behavior: 'smooth',
                block: 'center'
              });
            }
          }, 100);
        });
      }
    };

    const fetchUserConfig = async () => {
      try {
        const response = await getUserConfig();
        if (response.data) {
          if (response.data.currency_symbol) {
            currencySymbol.value = response.data.currency_symbol;
            if (userStats.accountBalance) {
              updateAccountBalanceDisplay();
            }
          }
        }
      } catch (error) {
        console.error('获取用户配置失败:', error);
      }
    };

    const updateAccountBalanceDisplay = () => {
      if (userBalance.value) {
        userStats.accountBalance = `${currencySymbol.value}${(parseFloat(userBalance.value) / 100).toFixed(2)}`;
      }
    };

    const getTrafficLogRows = (response) => {
      if (Array.isArray(response?.data)) return response.data;
      if (Array.isArray(response?.data?.data)) return response.data.data;
      return [];
    };


    const normalizeIpLocation = (payload = {}) => {
      const latitude = Number(
        payload.latitude ?? payload.lat ?? payload.location?.latitude ?? payload.loc?.split(',')?.[0]
      );
      const longitude = Number(
        payload.longitude ?? payload.lon ?? payload.lng ?? payload.location?.longitude ?? payload.loc?.split(',')?.[1]
      );
      const city = payload.city || payload.town || payload.district || '';
      const region = payload.region || payload.regionName || payload.state || '';
      const country = payload.country || payload.country_name || '';
      const countryCode = (payload.country_code || payload.countryCode || payload.countryCode2 || '').toString().toUpperCase();
      const ip = payload.ip || payload.query || '';

      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;

      return {
        ip,
        city,
        region,
        country,
        countryCode,
        latitude,
        longitude
      };
    };

    const fetchIpLocationFromSources = async () => {
      const endpoints = [
        'https://ipwho.is',
        'https://api.myip.com',
        'https://ipapi.co/json',
        'https://ident.me/json',
        'http://ip-api.com/json',
        'https://api.ip.sb/geoip',
        'https://ipinfo.io/json'
      ];

      const requests = endpoints.map((url) => (
        fetch(url, { cache: 'no-store' })
          .then(async (resp) => {
            if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
            const data = await resp.json();
            const normalized = normalizeIpLocation(data);
            if (!normalized) throw new Error('Invalid location payload');
            return normalized;
          })
      ));

      const settled = await Promise.allSettled(requests);
      const hit = settled.find((item) => item.status === 'fulfilled');
      if (hit && hit.status === 'fulfilled') {
        return hit.value;
      }
      throw new Error('IP location lookup failed on all providers.');
    };

    const scheduleIpLocationRefresh = (force = false) => {
      if (ipLocationDebounceTimer.value) {
        clearTimeout(ipLocationDebounceTimer.value);
      }

      ipLocationDebounceTimer.value = setTimeout(async () => {
        const now = Date.now();
        const cache = ipLocationCache.value;
        if (!force && cache?.expiresAt > now) {
          ipLocationData.value = cache.data;
          ipLocationError.value = '';
          return;
        }

        ipLocationLoading.value = true;
        ipLocationError.value = '';

        try {
          const data = await fetchIpLocationFromSources();
          ipLocationData.value = data;
          ipLocationCache.value = {
            data,
            expiresAt: now + 5 * 60 * 1000
          };
        } catch (error) {
          console.error('Failed to fetch IP location:', error);
          ipLocationError.value = t('trafficLog.errorLoadingTraffic');
        } finally {
          ipLocationLoading.value = false;
        }
      }, 2000);
    };

    const triggerIpLocationRefresh = () => {
      scheduleIpLocationRefresh(true);
    };

    const ipLocationDisplayText = computed(() => {
      if (!ipLocationData.value) return '';
      return [ipLocationData.value.city, ipLocationData.value.region, ipLocationData.value.country]
        .filter(Boolean)
        .join(', ');
    });

    const ipLocationCode = computed(() => {
      const code = (ipLocationData.value?.countryCode || '').trim().toUpperCase();
      return /^[A-Z]{2}$/.test(code) ? code : '--';
    });

    const ipLocationPrimaryRegionText = computed(() => {
      if (!ipLocationData.value) return '-';
      return ipLocationData.value.city || ipLocationData.value.region || ipLocationData.value.country || '-';
    });

    const ipLocationCodeBadgeClass = computed(() => {
      const code = ipLocationCode.value;
      const badgeMap = DASHBOARD_CONFIG.ipRegionBadgeByCountryCode || {};
      return badgeMap[code] || 'is-red';
    });

    const ipLocationServiceReferences = computed(() => {
      const code = ipLocationCode.value;
      const serviceMap = DASHBOARD_CONFIG.ipRegionServiceReferenceByCountryCode || {};
      const defaultServices = DASHBOARD_CONFIG.ipRegionServiceReferenceDefault || [];
      const services = serviceMap[code] || defaultServices;
      return Array.isArray(services) ? services : [];
    });

    const ipLocationServiceIconMap = {
      'Netflix': serviceNetflixIcon,
      'Disney+': serviceDisneyPlusIcon,
      'YouTube Premium': serviceYoutubePremiumIcon,
      'ChatGPT': serviceChatgptIcon,
      Claude: serviceClaudeIcon,
      Google: serviceGoogleIcon,
    };

    const ipLocationServiceCatalog = computed(() => {
      const serviceCatalog = DASHBOARD_CONFIG.ipRegionServiceCatalog || [];
      return serviceCatalog.map((item) => ({
        ...item,
        icon: ipLocationServiceIconMap[item.key] || serviceChatgptIcon,
      }));
    });

    const isIpServiceReferenced = (serviceKey) => {
      return ipLocationServiceReferences.value.includes(serviceKey);
    };

    const fetchTrafficTrend = async () => {
      trafficTrendLoading.value = true;
      trafficTrendError.value = false;
      try {
        const response = await getTrafficLog();
        const rows = getTrafficLogRows(response);
        const sorted = [...rows]
          .filter((item) => item && item.record_at)
          .sort((a, b) => Number(a.record_at) - Number(b.record_at))
          .slice(-30);
        trafficTrendData.value = sorted.map((item) => {
          const recordAt = Number(item.record_at);
          const timestampMs = recordAt > 1e12 ? recordAt : recordAt * 1000;
          const uploadGb = Number(((Number(item.u) || 0) / (1024 ** 3)).toFixed(2));
          const downloadGb = Number(((Number(item.d) || 0) / (1024 ** 3)).toFixed(2));
          return {
            date: new Date(timestampMs).toLocaleDateString(),
            uploadGb,
            downloadGb,
            totalGb: Number((uploadGb + downloadGb).toFixed(2))
          };
        });
      } catch (e) {
        console.error('Failed to fetch traffic trend data:', e);
        trafficTrendError.value = true;
        trafficTrendData.value = [];
      } finally {
        trafficTrendLoading.value = false;
        await nextTick();
        renderTrafficTrendChart();
      }
    };

    const renderTrafficTrendChart = () => {
      if (!trafficTrendChartRef.value || !trafficTrendData.value.length) {
        if (trafficTrendChart) {
          trafficTrendChart.dispose();
          trafficTrendChart = null;
        }
        return;
      }
      if (trafficTrendChart) {
        trafficTrendChart.dispose();
      }
      const rootStyles = getComputedStyle(document.documentElement);
      const textColor = rootStyles.getPropertyValue('--text-color').trim() || '#333333';
      const borderColor = rootStyles.getPropertyValue('--border-color').trim() || '#e8e8e8';
      const themeColor = rootStyles.getPropertyValue('--theme-color').trim() || '#6753f6';
      trafficTrendChart = echarts.init(trafficTrendChartRef.value);
      trafficTrendChart.setOption({
        tooltip: {
          trigger: 'axis',
          formatter: (params) => {
            let result = `${params[0]?.name || ''}<br/>`;
            params.forEach((param) => {
              result += `${param.marker} ${param.seriesName}: ${param.value} ${t('trafficLog.unitGb')}<br/>`;
            });
            return result;
          }
        },
        legend: {
          data: [t('trafficLog.uploadTraffic'), t('trafficLog.downloadTraffic'), t('trafficLog.totalTraffic')],
          bottom: 0,
          textStyle: { color: textColor }
        },
        grid: { left: '3%', right: '4%', bottom: '60px', top: '30px', containLabel: true },
        xAxis: {
          type: 'category',
          boundaryGap: false,
          data: trafficTrendData.value.map((i) => i.date),
          axisLabel: { rotate: 45, interval: 'auto', color: textColor },
          axisLine: { lineStyle: { color: borderColor } },
          splitLine: { lineStyle: { color: borderColor } }
        },
        yAxis: {
          type: 'value',
          name: t('trafficLog.unitGb'),
          nameTextStyle: { padding: [0, 0, 0, 10], color: textColor },
          axisLabel: { formatter: (value) => `${value} ${t('trafficLog.unitGb')}`, color: textColor },
          axisLine: { lineStyle: { color: borderColor } },
          splitLine: { lineStyle: { color: borderColor } }
        },
        series: [
          {
            name: t('trafficLog.uploadTraffic'),
            type: 'line',
            stack: 'Total',
            smooth: true,
            lineStyle: { width: 2 },
            showSymbol: false,
            areaStyle: { opacity: 0.2 },
            emphasis: { focus: 'series' },
            data: trafficTrendData.value.map((i) => i.uploadGb),
            color: '#36AD47'
          },
          {
            name: t('trafficLog.downloadTraffic'),
            type: 'line',
            stack: 'Total',
            smooth: true,
            lineStyle: { width: 2 },
            showSymbol: false,
            areaStyle: { opacity: 0.2 },
            emphasis: { focus: 'series' },
            data: trafficTrendData.value.map((i) => i.downloadGb),
            color: '#4080FF'
          },
          {
            name: t('trafficLog.totalTraffic'),
            type: 'line',
            smooth: true,
            lineStyle: { width: 3 },
            showSymbol: false,
            emphasis: { focus: 'series' },
            data: trafficTrendData.value.map((i) => i.totalGb),
            color: themeColor
          }
        ]
      });
    };

    onMounted(async () => {
      await fetchUserConfig();

      fetchUserInfo();

      fetchSubscribe();

      fetchNotices();

      fetchUserStats();
      fetchTrafficTrend();
      scheduleIpLocationRefresh();

      updateQRCodeUrl();
    });

    watch(() => userPlan.value.subscribeUrl, () => {
      updateQRCodeUrl();
    });

    const processedNoticeContent = computed(() => {
      if (!notices.value?.data?.[currentNoticeIndex.value]?.content) {
        return '';
      }

      const content = notices.value.data[currentNoticeIndex.value].content;

      const hasHtml = /<[a-z][\s\S]*>/i.test(content);

      if (hasHtml) {
        let processedContent = content.replace(/\n/g, '<br>');

        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = processedContent;

        const buttons = tempDiv.querySelectorAll('button, a');
        buttons.forEach(button => {
          if (button.className && button.className.includes('eztheme-btn')) {
            button.classList.remove('markdown-link');
            button.style.textDecoration = 'none';
            button.style.borderBottom = 'none';
            button.setAttribute('data-no-markdown-style', 'true');
          }

          if (button.tagName.toLowerCase() === 'a') {
            const href = button.getAttribute('href');
            if (href && (href.includes('#eztheme-btn') || href.includes('?eztheme-btn') || href.includes('class=eztheme-btn'))) {
              button.href = href
                  .replace('#eztheme-btn', '')
                  .replace('?eztheme-btn', '')
                  .replace('class=eztheme-btn', '');
              button.classList.add('eztheme-btn');
              button.style.textDecoration = 'none';
              button.style.borderBottom = 'none';
              button.setAttribute('data-no-markdown-style', 'true');
            }
          }
        });

        return tempDiv.innerHTML;
      } else {
        return md.render(content);
      }
    });

    const windowWidth = ref(window.innerWidth);
    const windowHeight = ref(window.innerHeight);
    const noticeModalStyle = ref({});

    const updateModalHeight = () => {
      const isMobile = windowWidth.value <= 768;
      const availableHeight = windowHeight.value * (isMobile ? 0.75 : 0.8);

      noticeModalStyle.value = {
        maxHeight: `${availableHeight}px`
      };
    };

    const handleResize = () => {
      windowWidth.value = window.innerWidth;
      windowHeight.value = window.innerHeight;
      if (showNoticeDetails.value) {
        updateModalHeight();
      }
      if (trafficTrendChart) {
        trafficTrendChart.resize();
      }
    };

    onMounted(() => {
      window.addEventListener('resize', handleResize);
    });

    onBeforeUnmount(() => {
      window.removeEventListener('resize', handleResize);
      if (trafficTrendChart) {
        trafficTrendChart.dispose();
        trafficTrendChart = null;
      }
      if (ipLocationDebounceTimer.value) {
        clearTimeout(ipLocationDebounceTimer.value);
        ipLocationDebounceTimer.value = null;
      }
    });

    const renewPlan = () => {
      if (!userPlanId.value) {
        showToast(t('dashboard.noPlanToRenew'), 'error', 3000);
        return;
      }

      router.push(`/order-confirm?id=${userPlanId.value}`);
    };

    const isXiaoPanel = isXiaoV2board();

    const navigateToDeposit = () => {
      router.push('/billing?tab=wallet');
    };

    const showDeviceLimit = computed(() => {
      return isXiaoV2board();
    });

    const timers = {};
    const listeners = {};

    const startAutoRotateNotices = () => {
      if (!autoRotateNotices.value) return;

      createTimer(timers, 'noticeRotation', () => {
        if (notices.value && notices.value.data && notices.value.data.length > 1) {
          nextNotice();
        }
      }, 8000, true);
    };

    onActivated(() => {
      console.log('Dashboard组件被激活');
      if (needRefreshData.value) {
        fetchUserInfo();
        fetchUserStats();
        fetchNotices();
        scheduleIpLocationRefresh();
        needRefreshData.value = false;
      }

      startAutoRotateNotices();
    });

    onDeactivated(() => {
      console.log('Dashboard组件被停用');
      needRefreshData.value = true;

      cleanupResources(timers, listeners);
    });

    onUnmounted(() => {
      cleanupResources(timers, listeners);
    });

    const needRefreshData = ref(false);

    const hasPurchasedTrafficPackage = computed(() => {
      const packageUsed = Math.max(
        trafficMetrics.totalUsedBytes - trafficMetrics.subscriptionQuotaUsedBytes,
        0
      );
      return packageUsed > 0 || trafficMetrics.packageQuotaRemainingBytes > 0;
    });

    const trafficBoardSections = computed(() => {
      const currentLocale = locale.value;
      void currentLocale;
      const packageUsedBytes = Math.max(
        trafficMetrics.totalUsedBytes - trafficMetrics.subscriptionQuotaUsedBytes,
        0
      );
      const packageTotalBytes = packageUsedBytes + trafficMetrics.packageQuotaRemainingBytes;

      const rows = [
        {
          key: 'total',
          title: t('dashboard.totalTrafficPackAndPackage'),
          used: trafficMetrics.totalUsedBytes,
          total: trafficMetrics.totalTrafficBytes,
          remaining: trafficMetrics.totalRemainingBytes
        },
        {
          key: 'subscription',
          title: t('dashboard.subscriptionMonthlyTraffic'),
          used: trafficMetrics.subscriptionQuotaUsedBytes,
          total: trafficMetrics.subscriptionQuotaTotalBytes,
          remaining: trafficMetrics.subscriptionQuotaRemainingBytes
        },
        {
          key: 'package',
          title: t('dashboard.trafficPackageQuota'),
          used: packageUsedBytes,
          total: packageTotalBytes,
          remaining: trafficMetrics.packageQuotaRemainingBytes
        }
      ];

      return rows.map((row) => {
        const usedPercentage = row.total > 0 ? Math.round((row.used / row.total) * 100) : 0;
        return {
          ...row,
          usedPercentage: Math.min(Math.max(usedPercentage, 0), 100),
          remainingPercentage: Math.min(Math.max(100 - usedPercentage, 0), 100)
        };
      });
    });

    return {
      userStats,
      userBalance,
      currencySymbol,
      userPlan,
      clientConfig,
      notices,
      loading,
      languageChangedSignal,
      goToShop,
      hasPendingItems,
      goToOrders,
      router,
      currentNoticeIndex,
      prevNotice,
      nextNotice,
      goToNotice,
      noticeBackgroundStyle,
      showImportCard,
      showQrCode,
      importToClient,
      formatDate,
      formatTraffic,
      formatPackageRemaining,
      toggleImportCard,
      copySubscription,
      platforms,
      activePlatform,
      qrCodeUrl,
      qrCodeLoading,
      qrCodeLoaded,
      showNoticeModal,
      closeNoticeModal,
      showNoticeDetails,
      checkForPopupNotices,
      noticeModalStyle,
      openResetTrafficModal,
      handlePopupClose,
      handlePopupConfirm,
      showPopup,
      closeResetTrafficModal,
      createResetTrafficOrder,
      showResetTrafficModal,
      resetConfirmCooldown,
      showResetTrafficButton,
      isCreatingResetOrder,
      hasIOSClients,
      hasAndroidClients,
      hasWindowsClients,
      hasMacOSClients,
      shadowrocketIcon,
      surgeIcon,
      stashIcon,
      quantumultIcon,
      singboxIcon,
      loonIcon,
      v2rayNGIcon,
      clashAndroidIcon,
      surfboardIcon,
      clashMetaAndroidIcon,
      nekoboxIcon,
      singboxAndroidIcon,
      hiddifyAndroidIcon,
      flclashIcon,
      clashvergeIcon,
      clashWindowsIcon,
      nekorayIcon,
      singboxWindowsIcon,
      hiddifyWindowsIcon,
      clashXIcon,
      clashMetaXIcon,
      surgeMacIcon,
      stashMacIcon,
      quantumultXMacIcon,
      singboxMacIcon,
      hiddifyMacIcon,
      isExpiringSoon,
      isExpired,
      isPlanExpired,
      subscriptionStatus,
      subscriptionStatusLabel,
      primaryPlanActionLabel,
      planExpireMetaText,
      secondaryPlanActionLabel,
      primaryActionClass,
      secondaryActionClass,
      handlePrimaryPlanAction,
      handleSecondaryPlanAction,
      isLowTraffic,
      isTrafficDepleted,
      hasPlan,
      processedNoticeContent,
      showRenewPlanButton,
      renewPlan,
      isXiaoPanel,
      navigateToDeposit,
      showDeviceLimit,
      needRefreshData,
      trafficBoardSections,
      autoRenewalEnabled,
      updatingAutoRenewalSetting,
      updateAutoRenewalSetting,
      hasPurchasedTrafficPackage,
      trafficTrendChartRef,
      trafficTrendData,
      trafficTrendLoading,
      trafficTrendError,
      ipLocationLoading,
      ipLocationError,
      ipLocationData,
      ipLocationDisplayText,
      ipLocationCode,
      ipLocationPrimaryRegionText,
      ipLocationCodeBadgeClass,
      ipLocationServiceReferences,
      ipLocationServiceCatalog,
      isIpServiceReferenced,
      triggerIpLocationRefresh,
      DASHBOARD_CONFIG,
      allowNewPeriod,
      showImportSubscription,
      showTrafficPackageModal,
      trafficPackageLoading,
      trafficPackagePlans,
      openTrafficPackageModal,
      purchaseTrafficPackage,
      normalizeTrafficPackagePrice,
      getTrafficPackageDisplayName,
      getTrafficPackageContent,
      isTrafficPackageSoldOut,
    };
  }
};
</script>

<style lang="scss" scoped>
.dashboard-container {
  padding: var(--dashboard-modal-body-padding);
  display: flex;
  justify-content: center;
  min-height: calc(100dvh - var(--top-fixed-bar-height));
  --dashboard-card-padding: var(--space-4);
  --dashboard-card-gap: var(--space-3);

  --saas-brand: var(--dashboard-brand);
  --saas-text-primary: var(--dashboard-text-primary);
  --saas-text-secondary: var(--dashboard-text-secondary);
  --saas-border-soft: var(--dashboard-border-soft);
  --saas-card-bg: var(--dashboard-card-bg);
  --saas-card-shadow: var(--dashboard-card-shadow);

  --theme-text-primary: var(--dashboard-text-primary);
  --theme-text-secondary: var(--dashboard-text-secondary);
  --theme-text-subtle: var(--dashboard-text-subtle);

  .dashboard-inner {
    width: 100%;
    max-width: var(--layout-content-max-width);
    display: grid;
    gap: var(--mobile-grid-gap);

    .overview-grid {
    display: grid;
    grid-template-columns: repeat(12, minmax(0, 1fr));
    gap: var(--space-4);

    > .pending-order-banner {
      grid-column: 1 / -1;
      margin-bottom: 0;
    }

    > .notice-card,
    > .subscription-card,
    > .stats-grid,
    > .ip-location-summary-card,
    > .usage-trend-card,
    > .import-card {
      grid-column: 1 / -1;
    }

    @media (max-width: 992px) {
      > .pending-order-banner,
      > .notice-card,
      > .subscription-card,
      > .stats-grid,
      > .ip-location-summary-card,
      > .usage-trend-card,
      > .import-card {
        grid-column: 1 / -1;
      }
    }
  }

  .dashboard-card {
    background-color: var(--saas-card-bg);
    border-radius: var(--dashboard-card-radius);
    box-shadow: var(--saas-card-shadow);
    padding: var(--dashboard-card-padding);
    margin-bottom: var(--dashboard-card-gap);
    border: none;
    transition: box-shadow var(--dashboard-transition-fast) var(--dashboard-transition-ease);

    &:hover {
      box-shadow: var(--dashboard-card-hover-shadow);
      transform: none;
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 15px;

      .card-title {
        font-size: 16px;
        font-weight: 600;
        margin: 0;
        color: var(--saas-text-primary);
      }

      .card-actions {
        display: flex;
        gap: var(--mobile-grid-gap);
      }
    }
  }

  .subscription-card {
    margin-bottom: 24px;

    .subscription-info {
      display: flex;
      flex-wrap: wrap;
      gap: 16px;
      margin-bottom: 15px;

      .info-item {
        display: flex;
        flex-direction: column;

        .info-label {
          font-size: 13px;
          color: var(--theme-text-secondary);
          margin-bottom: 5px;
        }

        .info-value {
          font-size: 16px;
          font-weight: 600;
          color: var(--theme-text-primary);
        }
      }
    }

    .subscription-actions {
      display: flex;
      gap: 12px;
      margin-top: 15px;

      @media (min-width: 769px) {
        flex-direction: row;
        flex-wrap: wrap;
        justify-content: flex-start;

        button {
          flex: 0 0 auto;
          min-width: 120px;
        }
      }

      @media (max-width: 768px) {
        flex-direction: column;
        gap: var(--mobile-grid-gap);

        button {
          width: 100%;
        }
      }

      .reset-traffic-btn {
        position: relative;
        overflow: hidden;

        &.reset-warning {
          color: color-mix(in srgb, var(--theme-color) 85%, #fff 15%);
          border-color: color-mix(in srgb, var(--theme-color) 85%, #fff 15%);
          background-color: var(--dashboard-warning-tint);
        }

        &.reset-danger {
          color: color-mix(in srgb, var(--theme-color) 95%, #fff 5%);
          border-color: color-mix(in srgb, var(--theme-color) 95%, #fff 5%);
          background-color: var(--dashboard-danger-tint);
        }
      }

      .renew-plan-btn {
        position: relative;
        overflow: hidden;

        &.renew-warning {
          color: color-mix(in srgb, var(--theme-color) 85%, #fff 15%);
          border-color: color-mix(in srgb, var(--theme-color) 85%, #fff 15%);
          background-color: var(--dashboard-warning-tint);
        }

        &.renew-danger {
          color: color-mix(in srgb, var(--theme-color) 95%, #fff 5%);
          border-color: color-mix(in srgb, var(--theme-color) 95%, #fff 5%);
          background-color: var(--dashboard-danger-tint);
        }
      }
    }
  }

  .stats-grid {
    position: relative;
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
    gap: 16px;
    margin-bottom: 24px;

    @media (min-width: 768px) {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    @media (min-width: 1200px) {
      grid-template-columns: minmax(0, 1.86fr) minmax(0, 1fr);
      grid-auto-rows: minmax(124px, auto);
    }

    .usage-panel-title-row {
      grid-column: 1 / -1;
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-top: 2px;

      @media (min-width: 1200px) {
        grid-row: 1;
      }

      h3 {
        margin: 0;
        font-size: 18px;
        font-weight: 700;
        color: var(--dashboard-text-primary);
      }

      .traffic-package-status {
        font-size: 12px;
        font-weight: 600;
        border-radius: 999px;
        padding: 6px 10px;
        background: var(--dashboard-status-chip-bg);
        color: var(--dashboard-status-chip-text);

        &.active {
          background: rgba(var(--theme-color-rgb), 0.14);
          color: var(--theme-color);
        }
      }
    }

    .expired-blur-target {
      filter: var(--dashboard-expired-filter);
      opacity: var(--dashboard-expired-opacity);
      pointer-events: none;
      user-select: none;
      transition: filter var(--dashboard-transition-fast) var(--dashboard-transition-ease), opacity var(--dashboard-transition-fast) var(--dashboard-transition-ease);
    }

    .stats-card {
      position: relative;
      background-color: var(--card-bg-color);
      border-radius: 16px;
      box-shadow: var(--dashboard-stat-shadow-soft);
      display: flex;
      align-items: center;
      gap: 16px;
      padding: var(--dashboard-modal-padding);
      transition: transform var(--dashboard-transition-normal) var(--dashboard-transition-ease), box-shadow var(--dashboard-transition-normal) var(--dashboard-transition-ease), background-color var(--dashboard-transition-normal) var(--dashboard-transition-ease), border-color var(--dashboard-transition-normal) var(--dashboard-transition-ease);
      overflow: hidden;
      border: 1px solid var(--border-color);

      .water-container {
        position: absolute;
        left: 0;
        bottom: 0;
        width: 100%;
        height: 100%;
        overflow: hidden;
        border-radius: inherit;
        pointer-events: none;
      }

      .water-progress {
        position: absolute;
        left: 0;
        bottom: 0;
        width: 100%;
        background-color: var(--dashboard-water-bg);
        transition: none;
        border-radius: 0 0 16px 16px;
        height: 0;

        &.animate-water {
          transition: height 1s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }

        &:after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
        }
      }

      .stats-icon, .stats-info {
        position: relative;
        z-index: 1;
      }

      &.traffic-board-card {
        min-width: 0;
        flex-direction: column;
        align-items: flex-start;
        gap: var(--dashboard-overview-gap-mobile);

        .stats-info {
          width: 100%;
        }

        .stats-value {
          font-size: 16px;
          margin-bottom: 2px;
        }

        .stats-label {
          font-size: 12px;
        }
      }

      &.traffic-board-card {
        width: 100%;
        min-width: 0;
        min-height: clamp(172px, 18vw, 232px);
        overflow: visible;
        writing-mode: horizontal-tb;
        text-orientation: mixed;
        flex-direction: column;
        align-items: flex-start;
        justify-content: flex-start;
        gap: var(--dashboard-overview-gap-mobile);

        .usage-card-title {
          position: relative;
          z-index: 5;
          display: inline-flex;
          align-items: center;
          gap: var(--mobile-grid-gap);
          writing-mode: horizontal-tb;
          text-orientation: mixed;
          white-space: normal;
          font-size: 16px;
          font-weight: 600;
          color: var(--neutral-strong);
          line-height: 1.35;
        }

        .usage-card-main {
          display: flex;
          align-items: baseline;
          gap: var(--mobile-grid-gap);

          &.package-main {
            align-items: baseline;
            width: 100%;
          }

          .package-add-btn {
            margin-left: auto;
            width: 26px;
            height: 26px;
            border-radius: 999px;
            border: none;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            color: var(--dashboard-text-inverse);
            background: linear-gradient(135deg, var(--button-primary-soft-start), var(--button-primary-start));
            box-shadow: 0 6px 14px rgba(var(--theme-color-rgb), 0.2);
            cursor: pointer;
          }
        }
        &.package-card-muted {
          background: var(--dashboard-status-chip-bg);
          border-color: #e5e7eb;

          .package-add-btn {
            color: var(--dashboard-text-inverse);
            background: linear-gradient(135deg, var(--button-primary-soft-start), var(--button-primary-start));
          }
        }
        &.subscription-card-muted {
          background: var(--dashboard-status-chip-bg);
          border-color: #e5e7eb;

          .section-progress-track {
            background: #e5e7eb;
          }

          .section-progress-fill {
            background: #cbd5e1;
          }
        }

        &.total-main-card {
          background: linear-gradient(180deg, #ffffff 0%, #f8fbff 100%);
          border-color: var(--border-color-soft);
          box-shadow: var(--shadow-card-md);

          .usage-card-title {
            color: #4b5563;
            font-weight: 650;
          }
        }

        &.expired-main-card {
          background: var(--dashboard-status-chip-bg);
          border-color: #d1d5db;

          .usage-card-title {
            color: var(--dashboard-status-chip-text);
          }
        }

        .plan-summary-card {
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 16px;
          margin-top: 6px;
          overflow: visible;

          .expired-status-strip {
            border-radius: 10px;
            padding: 9px 12px;
            font-size: 13px;
            font-weight: 600;
            color: #b91c1c;
            background: rgba(248, 113, 113, 0.16);
            border: 1px solid rgba(239, 68, 68, 0.32);
          }

          .plan-summary-section {
            border: none;
            border-radius: var(--dashboard-modal-item-radius);
            background: #f8fafc;
            padding: 10px 12px;
            overflow: visible;
          }

          .plan-summary-section-meta {
            padding: 12px 14px;
          }

          .plan-status-hero {
            display: flex;
            flex-direction: column;
            gap: var(--mobile-grid-gap);
          }

          .plan-name-main {
            font-size: 24px;
            line-height: 1.2;
            font-weight: 700;
            color: var(--heading-color);
          }

          .plan-expire-meta {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: var(--mobile-grid-gap);
            flex-wrap: wrap;
            font-size: 13px;
            color: #64748b;
          }

          .plan-summary-section-renew {
            background: #f8fafc;
          }

          .plan-summary-section-actions {
            background: #f8fafc;
            border: none;
            padding-top: 12px;
            padding-bottom: 12px;
          }

          .plan-summary-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 16px;
            padding: 2px 0;
          }

          .plan-summary-label {
            font-size: 12px;
            color: var(--dashboard-status-chip-text);

            &.with-tooltip {
              display: inline-flex;
              align-items: center;
              gap: var(--mobile-grid-gap);
            }
          }

          .plan-summary-value-wrap {
            display: inline-flex;
            align-items: center;
            gap: var(--mobile-grid-gap);
            justify-content: flex-end;
            flex-wrap: wrap;
          }

          .plan-summary-value {
            font-size: 14px;
            color: var(--dashboard-text-primary);
            font-weight: 600;
            text-align: right;
            word-break: break-word;
          }

          .plan-status-tag {
            display: inline-flex;
            align-items: center;
            border-radius: 999px;
            padding: 2px 8px;
            font-size: 12px;
            font-weight: 600;

            &.is-active {
              color: #15803d;
              background: rgba(34, 197, 94, 0.15);
            }

            &.is-expiring {
              color: #b45309;
              background: rgba(245, 158, 11, 0.16);
            }

            &.is-expired {
              color: #dc2626;
              background: rgba(220, 38, 38, 0.1);
            }
          }

          .plan-summary-desc {
            margin: 4px 0 0;
            font-size: 12px;
            color: var(--dashboard-status-chip-text);
          }

          .auto-renewal-row {
            align-items: flex-start;
          }

          .plan-summary-actions {
            display: flex;
            gap: var(--dashboard-overview-gap-mobile);
            margin-top: 0;


            .plan-action-btn {
              flex: 1;
              border-radius: var(--dashboard-modal-item-radius);
              border: 1px solid transparent;
              padding: 10px 14px;
              font-size: 14px;
              font-weight: 600;
              letter-spacing: 0.2px;
              cursor: pointer;
              transition: transform var(--dashboard-transition-quick) var(--dashboard-transition-ease), box-shadow var(--dashboard-transition-fast) var(--dashboard-transition-ease), background-color var(--dashboard-transition-fast) var(--dashboard-transition-ease), border-color var(--dashboard-transition-fast) var(--dashboard-transition-ease), color var(--dashboard-transition-fast) var(--dashboard-transition-ease);

              &:hover {
                transform: translateY(-1px);
              }

              &:active {
                transform: translateY(0);
              }

              &.primary {
                color: var(--dashboard-text-inverse);
                background: linear-gradient(135deg, var(--button-primary-start), var(--button-primary-end));
                box-shadow: 0 8px 18px rgba(var(--theme-color-rgb), 0.24);
              }

              &.premium {
                color: var(--dashboard-text-inverse);
                background: linear-gradient(135deg, var(--button-primary-soft-start), var(--button-primary-start));
                box-shadow: 0 8px 18px rgba(var(--theme-color-rgb), 0.24);
              }

              &.theme {
                color: var(--dashboard-text-inverse);
                border-color: transparent;
                background: linear-gradient(135deg, color-mix(in srgb, var(--theme-color) 90%, #fff 10%), var(--theme-color));
                box-shadow: 0 8px 18px rgba(var(--theme-color-rgb), 0.28);
              }

              &.subtle {
                color: var(--neutral-strong);
                border-color: var(--border-color-soft);
                background: var(--surface-subtle);
                box-shadow: none;
              }

              @media (max-width: 576px) {
                padding: 9px 10px;
                font-size: 13px;
              }
            }
          }

          .plan-action-helper-text {
            margin-top: 10px;
            font-size: 12px;
            color: #475569;
            text-align: center;
          }

          .switch {
            position: relative;
            display: inline-block;
            width: 44px;
            height: 24px;
            flex-shrink: 0;

            &.disabled {
              opacity: 0.6;
              cursor: not-allowed;
            }

            input {
              opacity: 0;
              width: 0;
              height: 0;
            }

            .slider {
              position: absolute;
              cursor: pointer;
              inset: 0;
              background-color: var(--surface-subtle);
              border: 1px solid var(--border-color-soft);
              transition: 0.3s;

              &::before {
                position: absolute;
                content: '';
                height: 18px;
                width: 18px;
                left: 3px;
                bottom: 3px;
                background-color: var(--dashboard-text-inverse);
                transition: 0.3s;
              }

              &.round {
                border-radius: 24px;

                &::before {
                  border-radius: 50%;
                }
              }
            }

            input:checked + .slider {
              background: linear-gradient(135deg, var(--button-primary-start), var(--button-primary-end));
              border-color: transparent;
            }

            input:checked + .slider::before {
              transform: translateX(20px);
            }
          }
        }

        .usage-percent {
          writing-mode: horizontal-tb;
          text-orientation: mixed;
          font-size: 36px;
          line-height: 1;
          font-weight: 700;
          color: var(--dashboard-text-primary);

          &.compact {
            font-size: 32px;
          }
        }

        .usage-percent-label {
          font-size: 13px;
          color: #4b5563;
          font-weight: 500;
        }

      &.traffic-board-subscription,
      &.traffic-board-package {
        .usage-percent {
          font-size: 30px;

          &.compact {
            font-size: 26px;
          }
        }
      }

        .usage-kpis {
          width: 100%;
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: var(--mobile-grid-gap);
        }

        .usage-summary-line {
          grid-column: 1 / -1;
          font-size: 13px;
          font-weight: 600;
          color: var(--neutral-strong);
        }

        .usage-kpi {
          display: flex;
          flex-direction: column;
          gap: 4px;
          padding: 8px;
          border-radius: 10px;
          background: #f8fafc;
        }

        .usage-kpi-label {
          writing-mode: horizontal-tb;
          text-orientation: mixed;
          font-size: 12px;
          color: var(--muted-text-color);
          line-height: 1;
        }

        .usage-kpi-value {
          writing-mode: horizontal-tb;
          text-orientation: mixed;
          font-size: 15px;
          color: #1f2937;
          font-weight: 600;
          line-height: 1.2;
        }

        .usage-package-note {
          width: 100%;
          margin-top: 6px;
          font-size: 12px;
          color: var(--muted-text-color);
          line-height: 1.35;
        }


        .usage-reset-hint {
          width: 100%;
          font-size: 12px;
          color: var(--dashboard-status-chip-text);
        }

        .section-progress-track {
          width: 100%;
          height: 14px;
          background: #e5e7eb;
          border-radius: 999px;
          overflow: hidden;
        }

        .section-progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #60a5fa, #3b82f6);
          border-radius: inherit;
          transition: width var(--dashboard-transition-emphasis) var(--dashboard-transition-ease);
        }

        @media (max-width: 576px) {
          .usage-kpis {
            grid-template-columns: 1fr;
          }
        }
      }

      @media (min-width: 1200px) {
        &.traffic-board-card.total-main-card {
          grid-column: 1;
          grid-row: 1 / span 2;
          min-height: 100%;
        }

        &.traffic-board-card:not(.total-main-card) {
          grid-column: 2;
          min-height: 152px;
          padding: var(--dashboard-modal-padding);
          gap: var(--mobile-grid-gap);

          .usage-card-title {
            font-size: 16px;
            font-weight: 600;
            color: var(--neutral-strong);
          }

          .usage-percent {
            font-size: 36px;

            &.compact {
              font-size: 30px;
            }
          }

          .usage-percent-label {
            font-size: 12px;
          }

          .section-progress-track {
            height: 8px;
          }

          .usage-kpis {
            display: flex;
            gap: 16px;
          }

          .usage-kpi {
            flex: 1;
            background: rgba(241, 245, 249, 0.9);
          }

          .usage-kpi-label {
            font-size: 12px;
          }

          .usage-kpi-value {
            font-size: 14px;
          }

          .usage-package-note,
          .usage-reset-hint {
            display: none;
          }

          .usage-summary-line,
          .usage-package-note,
          .usage-reset-hint {
            &.persist-visible {
              display: block;
            }
          }
        }
      }

      &.warning-card .water-progress {
        background-color: rgba(255, 152, 0, 0.15);
      }

      &.danger-card .water-progress {
        background-color: rgba(244, 67, 54, 0.15);
      }

      @keyframes wave {
        0% {
          transform: translateX(0) translateZ(0);
        }
        100% {
          transform: translateX(-50%) translateZ(0);
        }
      }

      &:hover {
        border-color: rgba(148, 163, 184, 0.24);
        box-shadow: 0 4px 14px rgba(15, 23, 42, 0.08);
      }

      .stats-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 60px;
        height: 60px;
        background-color: var(--dashboard-theme-tint-sm);
        border-radius: var(--dashboard-modal-item-radius);
        margin-right: 15px;
        color: var(--theme-color);
      }

      .stats-info {
        flex: 1;

        .stats-value {
          font-size: 18px;
          font-weight: 600;
          color: var(--theme-text-primary);
          margin-bottom: 5px;
        }

        .stats-label {
          font-size: 14px;
          color: var(--theme-text-secondary);
        }
      }

      .chevron-icon {
        color: var(--theme-color);
        opacity: 0.5;
        transition: all var(--dashboard-transition-normal) var(--dashboard-transition-ease);
      }

      &:hover {
        .chevron-icon {
          transform: translateX(3px);
          opacity: 1;
        }
      }
    }
  }


  .ip-location-summary-card {
    border-radius: 20px;
    border: 1px solid rgba(131, 159, 213, 0.22);
    background: radial-gradient(circle at 76% 50%, rgba(58, 103, 208, 0.26), transparent 40%),
      radial-gradient(circle at 15% 105%, rgba(26, 65, 154, 0.3), transparent 35%),
      linear-gradient(120deg, #0f172a 0%, #17233f 45%, #1c2747 100%);
    box-shadow: 0 10px 24px rgba(10, 20, 42, 0.28);

    .ip-location-summary-body {
      padding-top: 0;
    }

    .ip-location-state {
      color: #bddfff;
      font-size: 13px;

      &.error {
        color: #ff9ba8;
      }
    }

    .ip-location-content {
      display: grid;
      grid-template-columns: minmax(0, 1.05fr) minmax(0, 1.35fr);
      gap: 14px 18px;
      color: #d9ecff;
      align-items: start;
      position: relative;

      @media (max-width: 1220px) {
        grid-template-columns: 1fr;
        gap: 16px;
      }

      @media (max-width: 920px) {
        grid-template-columns: 1fr;
      }
    }

    .ip-card-arrow {
      position: absolute;
      top: 4px;
      right: 0;
      color: rgba(229, 236, 250, 0.86);
    }

    .ip-location-main-info {
      display: flex;
      flex-direction: column;
      gap: var(--dashboard-overview-gap-mobile);
      min-width: 0;
    }

    .ip-meta-title {
      color: rgba(233, 240, 255, 0.95);
      font-size: 18px;
      line-height: 1.2;
      font-weight: 700;
    }

    .ip-main-line {
      display: flex;
      align-items: center;
      gap: var(--dashboard-overview-gap-mobile);
      flex-wrap: wrap;
    }

    .ip-region-primary {
      font-size: 44px;
      line-height: 1.15;
      font-weight: 700;
      letter-spacing: -0.02em;
      color: #ecf6ff;

      @media (max-width: 1220px) {
        font-size: 38px;
      }

      @media (max-width: 680px) {
        font-size: 30px;
      }
    }

    .ip-sub-line {
      display: flex;
      align-items: center;
      gap: var(--mobile-grid-gap);
      flex-wrap: wrap;
    }

    .ip-refresh-btn {
      border: 1px solid rgba(165, 194, 246, 0.35);
      background: rgba(255, 255, 255, 0.08);
      color: #e7f1ff;
      border-radius: 999px;
      padding: 4px 10px;
      font-size: 12px;
      line-height: 1;
      display: inline-flex;
      align-items: center;
      gap: var(--mobile-grid-gap);
      cursor: pointer;
      transition: all var(--dashboard-transition-fast) var(--dashboard-transition-ease);

      &:hover:not(:disabled) {
        background: rgba(255, 255, 255, 0.14);
        border-color: rgba(188, 211, 248, 0.48);
      }

      &:disabled {
        opacity: 0.7;
        cursor: not-allowed;
      }

      .spinning {
        animation: spin 0.9s linear infinite;
      }
    }

    .ip-address-secondary {
      font-size: 11px;
      color: rgba(189, 223, 255, 0.58);
      letter-spacing: 0.2px;
    }

    .ip-status-row {
      display: inline-flex;
      align-items: center;
      gap: var(--mobile-grid-gap);
      color: #e9f3ff;
      font-size: 16px;
      font-weight: 600;

      .status-dot {
        width: 12px;
        height: 12px;
        border-radius: 50%;
        background: #35c26b;
        box-shadow: 0 0 0 4px rgba(53, 194, 107, 0.2);
      }
    }

    .region-code-badge {
      min-width: 44px;
      height: 24px;
      border-radius: 999px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 0 8px;
      font-size: 11px;
      font-weight: 800;
      color: var(--dashboard-text-inverse);
      letter-spacing: 0.5px;
      background: linear-gradient(135deg, var(--neutral-strong), #1e293b);
      box-shadow: 0 6px 14px rgba(15, 23, 42, 0.28);

      &.is-red { background: linear-gradient(135deg, #e11d48, #9f1239); }
      &.is-pink { background: linear-gradient(135deg, #be185d, #831843); }
      &.is-blue { background: linear-gradient(135deg, #1d4ed8, #1e3a8a); }
    }

    .ip-region {
      color: #bddfff;
      font-size: 13px;
    }

    .ip-service-reference {
      display: flex;
      flex-direction: column;
      gap: 12px;
      padding: 10px 12px;
      border-radius: var(--dashboard-modal-item-radius);
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(164, 191, 242, 0.24);
      min-height: 100%;
    }

    .service-reference-title {
      display: inline-flex;
      align-items: center;
      gap: var(--mobile-grid-gap);
      font-size: 16px;
      font-weight: 700;
      color: #f3f7ff;
      letter-spacing: 0.2px;
    }

    .service-reference-tags {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: var(--mobile-grid-gap);
      overflow: visible;
      padding-bottom: 2px;
    }

    @media (max-width: 680px) {
      .service-reference-tags {
        grid-template-columns: 1fr;
      }
    }

    .service-reference-item {
      width: 100%;
      min-height: 38px;
      border-radius: 999px;
      display: inline-flex;
      flex-direction: row;
      align-items: center;
      justify-content: flex-start;
      gap: var(--mobile-grid-gap);
      white-space: nowrap;
      padding: 6px 12px;
      border: none;
      background: rgba(255, 255, 255, 0.08);
      color: rgba(233, 243, 255, 0.92);
      opacity: 0.84;
      transition: all var(--dashboard-transition-fast) var(--dashboard-transition-ease);

      .service-reference-tile {
        width: 24px;
        height: 24px;
        border-radius: var(--dashboard-modal-action-radius);
        display: inline-flex;
        align-items: center;
        justify-content: center;
        background: #ffffff;
        box-shadow: 0 0 0 1px rgba(190, 209, 247, 0.25);
      }

      .service-reference-label {
        font-size: 13px;
        line-height: 1;
        color: #ebf2ff;
        font-weight: 600;
      }

      .service-reference-icon {
        width: 18px;
        height: 18px;
        display: block;
        object-fit: contain;
        filter: none;
      }

      &.active {
        opacity: 1;
        color: #eef6ff;
        background: rgba(255, 255, 255, 0.16);
      }

      &:hover {
        opacity: 1;
        transform: translateY(-1px);
      }
    }

    .info-tooltip {
      position: relative;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 16px;
      height: 16px;
      border-radius: 50%;
      color: rgba(148, 163, 184, 0.95);
      cursor: help;

      .info-tooltip-content {
        position: absolute;
        right: 0;
        bottom: calc(100% + 8px);
        width: 200px;
        padding: 8px 10px;
        border-radius: var(--dashboard-modal-action-radius);
        background: rgba(15, 23, 42, 0.96);
        color: #e2e8f0;
        font-size: 12px;
        line-height: 1.4;
        font-weight: 500;
        box-shadow: 0 8px 22px rgba(2, 6, 23, 0.35);
        opacity: 0;
        visibility: hidden;
        transform: translateY(4px);
        transition: opacity var(--dashboard-transition-fast) var(--dashboard-transition-ease), transform var(--dashboard-transition-fast) var(--dashboard-transition-ease), visibility var(--dashboard-transition-fast) var(--dashboard-transition-ease);
        transition-delay: 0s;
        pointer-events: none;
        z-index: 30;
      }

      .info-tooltip-content::after {
        content: '';
        position: absolute;
        right: 12px;
        top: 100%;
        border-width: 5px;
        border-style: solid;
        border-color: rgba(15, 23, 42, 0.96) transparent transparent transparent;
      }

      &:hover .info-tooltip-content,
      &:focus-visible .info-tooltip-content {
        opacity: 1;
        visibility: visible;
        transform: translateY(0);
        transition-delay: 0.2s;
      }
    }
  }

  .info-tooltip {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    color: rgba(148, 163, 184, 0.95);
    cursor: help;

    .info-tooltip-content {
      position: absolute;
      right: 0;
      bottom: calc(100% + 8px);
      width: 200px;
      padding: 8px 10px;
      border-radius: var(--dashboard-modal-action-radius);
      background: rgba(15, 23, 42, 0.96);
      color: #e2e8f0;
      font-size: 12px;
      line-height: 1.4;
      font-weight: 500;
      box-shadow: 0 8px 22px rgba(2, 6, 23, 0.35);
      opacity: 0;
      visibility: hidden;
      transform: translateY(4px);
      transition: opacity var(--dashboard-transition-fast) var(--dashboard-transition-ease), transform var(--dashboard-transition-fast) var(--dashboard-transition-ease), visibility var(--dashboard-transition-fast) var(--dashboard-transition-ease);
      transition-delay: 0s;
      pointer-events: none;
      z-index: 30;
    }

    .info-tooltip-content::after {
      content: '';
      position: absolute;
      right: 12px;
      top: 100%;
      border-width: 5px;
      border-style: solid;
      border-color: rgba(15, 23, 42, 0.96) transparent transparent transparent;
    }

    &:hover .info-tooltip-content,
    &:focus-visible .info-tooltip-content {
      opacity: 1;
      visibility: visible;
      transform: translateY(0);
      transition-delay: 0.2s;
    }
  }

  .usage-trend-card {
    .card-body {
      padding-top: 6px;
    }

    .trend-state {
      min-height: 140px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--theme-text-secondary);
      font-size: 14px;
    }

    .usage-trend-chart {
      width: 100%;
      height: 280px;
    }
  }

  .notice-card {
    margin-bottom: 12px;
    padding: 12px;
    border-color: rgba(148, 163, 184, 0.14);
    background: color-mix(in srgb, var(--card-bg-color) 98%, rgba(var(--theme-color-rgb), 0.02));
    box-shadow: 0 1px 6px rgba(15, 23, 42, 0.04);

    &:hover {
      box-shadow: 0 2px 8px rgba(15, 23, 42, 0.06);
      border-color: rgba(148, 163, 184, 0.2);
      transform: none;
    }

    .card-body {
      padding: 0;
    }

    .notice-slider {
      display: flex;
      flex-direction: column;
      gap: var(--mobile-grid-gap);
    }

    .notice-item {
      position: relative;
      padding: 12px 14px;
      border-radius: var(--dashboard-modal-action-radius);
      background-color: rgba(var(--theme-color-rgb), 0.045);
      overflow: hidden;
      min-height: 84px;

      .notice-overlay {
        position: absolute;
        inset: 0;
        background: linear-gradient(135deg, rgba(15, 23, 42, 0.64), rgba(15, 23, 42, 0.2));
        pointer-events: none;
      }

      .notice-content {
        position: relative;
        z-index: 1;
      }

      .notice-title {
        font-size: 14px;
        font-weight: 600;
        margin-bottom: 6px;
        color: var(--dashboard-text-inverse);
        line-height: 1.35;
      }

      .notice-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-wrap: wrap;
        gap: var(--mobile-grid-gap);

        .notice-date {
          font-size: 11px;
          color: rgba(255, 255, 255, 0.85);
        }

        .notice-nav {
          display: flex;
          gap: var(--mobile-grid-gap);

          .btn-notice {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 3px;
            padding: 5px 8px;
            border-radius: var(--dashboard-modal-action-radius);
            font-size: 12px;
            background-color: rgba(var(--theme-color-rgb), 0.14);
            color: var(--dashboard-text-inverse);
            border: none;
            cursor: pointer;
            transition: all var(--dashboard-transition-fast) var(--dashboard-transition-ease);

            &:hover:not(:disabled) {
              background-color: rgba(var(--theme-color-rgb), 0.35);
              transform: translateY(-1px);
            }

            &:disabled {
              opacity: 0.5;
              cursor: not-allowed;
            }
          }
        }

        @media (max-width: 576px) {
          flex-direction: column;
          align-items: flex-start;

          .notice-nav {
            width: 100%;

            .btn-notice {
              flex: 1;
              justify-content: center;
              padding: 6px;
            }
          }
        }

        @media (max-width: 470px) {
          .notice-nav {
            display: grid;
            grid-template-rows: auto auto;
            gap: var(--mobile-grid-gap);
            width: 100%;

            .btn-notice:nth-child(2) {
              grid-row: 1;
              grid-column: 1 / span 2;
            }

            .btn-notice:nth-child(1),
            .btn-notice:nth-child(3) {
              grid-row: 2;
            }

            .btn-notice:nth-child(1) {
              grid-column: 1;
            }

            .btn-notice:nth-child(3) {
              grid-column: 2;
            }

            .btn-notice {
              margin: 0;
              width: 100%;
            }
          }
        }
      }
    }

    .notice-dots {
      display: flex;
      justify-content: center;
      gap: var(--mobile-grid-gap);
      margin-top: 2px;

      .notice-dot {
        width: 6px;
        height: 6px;
        border-radius: 999px;
        border: none;
        padding: 0;
        background: rgba(var(--theme-color-rgb), 0.25);
        cursor: pointer;
        transition: all var(--dashboard-transition-fast) var(--dashboard-transition-ease);

        &.active {
          width: 14px;
          background: rgba(var(--theme-color-rgb), 0.95);
        }
      }
    }
  }


  .pending-order-banner {
    margin-bottom: 8px;
    min-height: 44px;
    max-height: 48px;
    padding: 6px 12px;
    border-radius: 10px;
    border: 1px solid #FFE58F;
    background: #FFFBE6;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--dashboard-overview-gap-mobile);
    cursor: pointer;
    transition: background-color var(--dashboard-transition-fast) var(--dashboard-transition-ease), border-color var(--dashboard-transition-fast) var(--dashboard-transition-ease), transform var(--dashboard-transition-fast) var(--dashboard-transition-ease);

    &:hover {
      background: #FFF7D6;
      border-color: #FFD666;
      transform: none;
    }

    .banner-main {
      display: inline-flex;
      align-items: center;
      gap: var(--mobile-grid-gap);
      min-width: 0;
      color: #8C6D1F;
      font-size: 13px;
      line-height: 1.35;
      font-weight: 500;
    }

    .banner-icon {
      flex-shrink: 0;
      color: #8C6D1F;
    }

    .banner-text {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .banner-action {
      border: none;
      border-radius: var(--dashboard-modal-action-radius);
      height: 30px;
      padding: 0 12px;
      color: var(--dashboard-text-inverse);
      background: var(--saas-brand);
      box-shadow: none;
      cursor: pointer;
      font-size: 13px;
      font-weight: 600;
      flex-shrink: 0;
    }
  }

  .status-badge,
  .status-tag {
    display: inline-flex;
    align-items: center;
    height: 22px;
    padding: 0 8px;
    border-radius: 999px;
    font-size: 12px;
    font-weight: 600;
    border: none;
  }

  .status-badge.success, .status-tag.success { background: #ecfdf3; color: #166534; }
  .status-badge.warning, .status-tag.warning { background: #fff7e6; color: #8c6d1f; }
  .status-badge.error, .status-tag.error { background: #fef2f2; color: #991b1b; }
}


.skeleton-loading {
  overflow: hidden;
  position: relative;

  &::after {
    content: '';
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    transform: translateX(-100%);
    background-image: linear-gradient(
            90deg,
            rgba(255, 255, 255, 0) 0,
            rgba(255, 255, 255, 0.2) 20%,
            rgba(255, 255, 255, 0.5) 60%,
            rgba(255, 255, 255, 0) 100%
    );
    animation: shimmer 2s infinite;
    z-index: 1;
  }
}

@keyframes shimmer {
  100% {
    transform: translateX(100%);
  }
}


.btn-primary, .btn-outline, .btn-action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: var(--dashboard-modal-cancel-padding);
  border-radius: var(--dashboard-modal-action-radius);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all var(--dashboard-transition-normal) var(--dashboard-transition-ease);

  .btn-icon {
    margin-right: 4px;
  }
}

.btn-primary {
  background-color: #355cc2;
  color: var(--dashboard-text-inverse);
  border: none;

  &:hover {
    background-color: #2f4fa8;
    transform: none;
  }
}

.btn-outline {
  background-color: #f3f4f6;
  color: #374151;
  border: none;

  &:hover {
    background-color: #e5e7eb;
    color: var(--dashboard-text-primary);
    transform: none;
  }


  &.btn-highlight-btnbgcolor {
    position: relative;
    overflow: hidden;
    background-color: var(--theme-color);
    color: white;
    border-color: var(--theme-color);

    &:hover {
      background-color: var(--primary-color-hover, var(--theme-color));
      color: white;
      transform: translateY(-1px);
      box-shadow: 0 2px 8px rgba(var(--theme-color-rgb), 0.25);
    }

    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: -100%;
      width: 50%;
      height: 100%;
      background: linear-gradient(
              to right,
              rgba(255, 255, 255, 0) 0%,
              rgba(255, 255, 255, 0.2) 50%,
              rgba(255, 255, 255, 0) 100%
      );
      animation: card-shimmer 3s infinite;
      transform: skewX(-25deg);
    }
  }
}

@keyframes card-shimmer {
  0% {
    left: -100%;
  }
  100% {
    left: 200%;
  }
}

.btn-action {
  background-color: transparent;
  color: var(--theme-text-secondary);
  border: none;
  padding: 5px 10px;
  font-size: 13px;

  &:hover {
    color: var(--theme-color);
    background-color: var(--dashboard-theme-tint-xs);
  }

  .action-icon {
    width: 16px;
    height: 16px;
  }
}


.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all var(--dashboard-transition-normal) var(--dashboard-transition-ease);
}

.fade-slide-enter-from {
  opacity: 0;
  transform: translateX(20px);
}

.fade-slide-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}


@media (max-width: 768px) {
  .dashboard-container {
    padding: var(--layout-gutter-mobile);
    padding-bottom: calc(72px + var(--safe-bottom));
    --dashboard-card-padding: var(--mobile-card-padding);
    --dashboard-card-gap: var(--mobile-grid-gap);
  }

  .dashboard-inner {
    gap: var(--mobile-grid-gap);
  }

  .dashboard-inner .overview-grid {
    grid-template-columns: 1fr;
    gap: var(--dashboard-overview-gap-mobile);
  }

  .stats-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: var(--dashboard-overview-gap-mobile);

    .stats-card.traffic-board-total {
      grid-column: 1 / -1;
    }

    .stats-card.traffic-board-subscription,
    .stats-card.traffic-board-package {
      grid-column: 1 / -1;
      min-height: auto;
      height: auto;
      padding: var(--layout-gutter-mobile);
      gap: 5px;

      .usage-percent {
        font-size: 24px;

        &.compact {
          font-size: 22px;
        }
      }

      .usage-percent-label {
        font-size: 12px;
      }

      .usage-kpis {
        gap: var(--mobile-grid-gap);
      }

      .usage-kpi {
        padding: 6px;
      }

      .usage-package-note {
        margin-top: 2px;
      }
    }
  }

  .subscription-card .subscription-info {
    flex-direction: column;
    gap: 12px;
  }

  .subscription-card .info-item {
    width: 100%;
    padding: 0;
    border-right: none;
    border-bottom: 1px solid var(--border-light-color);
    padding-bottom: 12px;
  }

  .subscription-card .info-item:last-child {
    border-bottom: none;
  }

  .subscription-actions {
    flex-direction: column;
    margin-top: 12px;
  }

  .platform-selector {
    flex-wrap: wrap;
  }

  .no-plan-content {
    flex-direction: column;
    text-align: center;
    align-items: center;
    gap: 16px;
    width: 100%;
  }

  .no-plan-icon {
    width: 65px;
    height: 65px;
    margin: 0 auto;
    transform: rotate(0deg);
  }

  .no-plan-icon .icon-cart {
    width: 36px;
    height: 36px;
  }

  .no-plan-message {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
    text-align: center;
  }

  .no-plan-title {
    font-size: 1.1rem;
    margin-bottom: 12px;
    text-align: center;
  }

  .no-plan-actions {
    justify-content: center;
    width: 100%;
    gap: var(--dashboard-overview-gap-mobile);
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
  }

  .no-plan-actions .action-button {
    padding: 8px 15px;
    min-width: 120px;
    justify-content: center;
  }

  .no-plan-actions .action-button span {
    font-size: 14px;
  }

  .no-plan-actions .action-button .btn-icon {
    width: 16px;
    height: 16px;
  }

  .stats-card.no-plan-card {
    padding: 15px 12px;
  }
}

@media (min-width: 769px) {
  .subscription-actions {
    display: flex;
    flex-direction: row;
    gap: 12px;
  }
}

@media (min-width: 769px) and (max-width: 1199px) {
  .stats-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}


.stats-card.doc-card {
  cursor: pointer;
  transition: all var(--dashboard-transition-normal) var(--dashboard-transition-ease);
  position: relative;
  overflow: hidden;
}

.stats-card.doc-card:hover {
  background-color: rgba(var(--theme-color-rgb), 0.08);
  transform: translateY(-3px);
}

.stats-card.doc-card .stats-icon {
  background-color: rgba(92, 124, 250, 0.15);
  color: rgba(var(--theme-color-rgb), 0.88);
}

.stats-card.doc-card .stats-value {
  color: var(--theme-color);
}

.stats-card.doc-card::after {
  content: "";
  position: absolute;
  top: 0;
  left: -100%;
  width: 50%;
  height: 100%;
  background: linear-gradient(
          to right,
          rgba(255, 255, 255, 0) 0%,
          rgba(255, 255, 255, 0.2) 50%,
          rgba(255, 255, 255, 0) 100%
  );
  animation: card-shimmer 3s infinite;
  transform: skewX(-25deg);
}

@keyframes card-shimmer {
  0% {
    left: -100%;
  }
  100% {
    left: 200%;
  }
}


.btn-active {
  background-color: var(--dashboard-theme-tint-sm);
  color: var(--theme-color);
  border-color: var(--theme-color);
}


.import-card {
  display: none;
  margin-bottom: 24px;
  overflow: hidden;
  will-change: transform, opacity;
  transform-origin: top center;
  contain: content;
}

.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: opacity var(--dashboard-transition-medium) var(--dashboard-transition-ease), transform var(--dashboard-transition-medium) var(--dashboard-transition-ease);
  will-change: opacity, transform;
  backface-visibility: hidden;
}

.slide-fade-enter-from,
.slide-fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

.close-btn {
  width: 36px;
  height: 36px;
  border-radius: var(--dashboard-modal-action-radius);
  background-color: transparent;
  border: none;
  position: relative;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);

  &:hover {
    background-color: var(--dashboard-theme-tint-sm);
    transform: rotate(90deg);

    .close-icon::before,
    .close-icon::after {
      background-color: var(--theme-color);
    }
  }

  &:focus {
    outline: none;
    box-shadow: 0 0 0 2px rgba(var(--theme-color-rgb), 0.2);
  }

  .close-icon {
    position: relative;
    width: 20px;
    height: 20px;

    &::before,
    &::after {
      content: '';
      position: absolute;
      width: 100%;
      height: 2px;
      background-color: var(--theme-text-secondary);
      border-radius: 2px;
      top: 50%;
      left: 0;
      transition: background-color var(--dashboard-transition-fast) var(--dashboard-transition-ease);
    }

    &::before {
      transform: translateY(-50%) rotate(45deg);
    }

    &::after {
      transform: translateY(-50%) rotate(-45deg);
    }
  }
}

.import-action {
  display: flex;
  align-items: center;
  padding: var(--dashboard-modal-padding);
  border-radius: 10px;
  cursor: pointer;
  background-color: var(--dashboard-theme-tint-xs);
  margin-bottom: 16px;
  transition: all var(--dashboard-transition-normal) var(--dashboard-transition-ease);

  &:hover {
    background-color: var(--dashboard-theme-tint-sm);
    transform: translateY(-2px);
  }

  .import-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 50px;
    height: 50px;
    border-radius: 10px;
    margin-right: 16px;
    background-color: var(--dashboard-theme-tint-sm);
    color: var(--theme-color);
  }

  .import-content {
    flex: 1;

    .import-title {
      font-size: 14px;
      font-weight: 600;
      margin-bottom: 4px;
    }

    .import-desc {
      font-size: 12px;
      color: var(--theme-text-secondary);
    }
  }
}

.copy-action .import-icon {
  background-color: rgba(25, 113, 194, 0.1);
  color: rgba(var(--theme-color-rgb), 0.88);
}

.qrcode-action .import-icon {
  background-color: rgba(64, 192, 87, 0.1);
  color: rgba(var(--theme-color-rgb), 0.9);
}

.platform-section {
  margin-bottom: 24px;

  .platform-title {
    font-size: 14px;
    font-weight: 600;
    margin-bottom: 12px;
    padding-bottom: 8px;
    border-bottom: 1px solid rgba(var(--theme-color-rgb), 0.1);
  }

  .platform-options {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: 12px;

    .platform-option {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: var(--dashboard-modal-padding);
      border-radius: 10px;
      background-color: var(--dashboard-theme-tint-xs);
      cursor: pointer;
      transition: all var(--dashboard-transition-normal) var(--dashboard-transition-ease);

      &:hover {
        background-color: var(--dashboard-theme-tint-sm);
        transform: translateY(-3px);
        border-color: var(--theme-color);
      }

      svg {
        margin-bottom: 8px;
        color: var(--theme-color);
      }

      span {
        font-size: 13px;
      }
    }
  }
}


.qrcode-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}

.qrcode-modal {
  background-color: rgba(var(--card-background-rgb, 255, 255, 255), 1);
  border-radius: 16px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);
  border: 1px solid rgba(var(--theme-color-rgb), 0.15);
  width: 90%;
  max-width: 360px;
  overflow: hidden;
  animation: modal-in 0.3s cubic-bezier(0.16, 1, 0.3, 1);

}

@keyframes modal-in {
  from {
    opacity: 0;
    transform: translateY(10px) scale(0.98);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.qrcode-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--dashboard-modal-header-padding);
  border-bottom: 1px solid var(--border-color);
  background-color: rgba(var(--theme-color-rgb), 0.03);

  h3 {
    margin: 0;
    font-size: 18px;
    color: var(--theme-text-primary);
    font-weight: 600;
  }
}

.qrcode-content {
  padding: 30px;
  display: flex;
  justify-content: center;
  align-items: center;
  background: linear-gradient(to bottom, rgba(var(--theme-color-rgb), 0.02), transparent);

  img {
    width: 220px;
    height: 220px;
    border-radius: var(--dashboard-modal-item-radius);
    box-shadow: 0 4px 14px rgba(15, 23, 42, 0.08);
    background-color: white;
    padding: 15px;
    object-fit: cover;
    transition: box-shadow var(--dashboard-transition-normal) var(--dashboard-transition-ease);

    &:hover {
      box-shadow: 0 6px 20px rgba(0, 0, 0, 0.12);
    }
  }

  .qrcode-loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 25px;
    min-height: 220px;

    .loading-spinner {
      width: 50px;
      height: 50px;
      border: 3px solid rgba(var(--theme-color-rgb), 0.2);
      border-radius: 50%;
      border-top-color: var(--theme-color);
      animation: spin 1s ease-in-out infinite;
      margin-bottom: 15px;
    }

    p {
      font-size: 15px;
      color: var(--theme-text-secondary);
      font-weight: 500;
    }
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity var(--dashboard-transition-normal) var(--dashboard-transition-ease);
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@media (max-width: 768px) {
  .platform-options {
    grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  }

  .import-action {
    padding: 12px;

    .import-icon {
      width: 40px;
      height: 40px;
    }
  }
}


.platform-selector {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  flex-wrap: wrap;
  justify-content: center;

  .platform-button {
    display: flex;
    align-items: center;
    gap: var(--mobile-grid-gap);
    background-color: var(--dashboard-theme-tint-xs);
    border: 1px solid var(--border-color);
    border-radius: 20px;
    padding: var(--dashboard-modal-cancel-padding);
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all var(--dashboard-transition-normal) var(--dashboard-transition-ease);
    color: var(--theme-text-primary);

    &:hover {
      background-color: var(--dashboard-theme-tint-sm);
      transform: translateY(-1px);
      border-color: rgba(var(--theme-color-rgb), 0.2);
    }

    &.active {
      background-color: rgba(var(--theme-color-rgb), 0.15);
      color: var(--theme-color);
      border-color: var(--theme-color);
      font-weight: 600;
      box-shadow: 0 2px 6px rgba(var(--theme-color-rgb), 0.2);
    }

    svg {
      color: var(--theme-color);
      opacity: 0.8;
    }
  }
}


.client-icon {
  width: 24px;
  height: 24px;
  border-radius: 5px;
  margin-bottom: 8px;
  object-fit: cover;
}

.platform-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--dashboard-modal-padding);
  border-radius: 10px;
  background-color: var(--dashboard-theme-tint-xs);
  cursor: pointer;
  transition: all var(--dashboard-transition-normal) var(--dashboard-transition-ease);

  svg {
    margin-bottom: 8px;
    color: var(--theme-color);
  }

  span {
    font-size: 14px;
  }
}


.stats-card.warning-card {
  border-color: color-mix(in srgb, var(--theme-color) 85%, #fff 15%);
  box-shadow: 0 4px 10px rgba(255, 152, 0, 0.15);

  .stats-icon {
    background-color: var(--dashboard-warning-tint);
    color: color-mix(in srgb, var(--theme-color) 85%, #fff 15%);
  }

  .stats-value {
    color: color-mix(in srgb, var(--theme-color) 85%, #fff 15%);
  }
}

.stats-card.danger-card {
  border-color: color-mix(in srgb, var(--theme-color) 95%, #fff 5%);
  box-shadow: 0 4px 10px rgba(244, 67, 54, 0.15);

  .stats-icon {
    background-color: var(--dashboard-danger-tint);
    color: color-mix(in srgb, var(--theme-color) 95%, #fff 5%);
  }

  .stats-value {
    color: color-mix(in srgb, var(--theme-color) 95%, #fff 5%);
  }
}




.skeleton-card {
  width: 100%;
  border-radius: 16px;
  overflow: hidden;
  position: relative;

  &::after {
    content: '';
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    transform: translateX(-100%);
    background-image: linear-gradient(
            90deg,
            rgba(255, 255, 255, 0) 0,
            rgba(255, 255, 255, 0.2) 20%,
            rgba(255, 255, 255, 0.5) 60%,
            rgba(255, 255, 255, 0) 100%
    );
    animation: shimmer 2s infinite;
    z-index: 1;
  }
}


.skeleton-header {
  height: 24px;
  margin-bottom: 20px;
  background-color: var(--skeleton-bg, rgba(0, 0, 0, 0.05));
  border-radius: var(--dashboard-modal-action-radius);
  width: 30%;
  margin: 16px 20px;
  position: relative;
}

.skeleton-body {
  padding: 0 20px 20px;
}

.skeleton-row {
  height: 16px;
  margin-bottom: 16px;
  background-color: var(--skeleton-bg, rgba(0, 0, 0, 0.05));
  border-radius: 4px;
  width: 100%;
  position: relative;
}

.skeleton-row:last-child {
  width: 75%;
  margin-bottom: 0;
}







.skeleton-icon {
  width: 48px;
  height: 48px;
  border-radius: var(--dashboard-modal-item-radius);
  background-color: var(--skeleton-bg, rgba(0, 0, 0, 0.05));
  margin-right: 16px;
  flex-shrink: 0;
  position: relative;
}

.skeleton-content {
  flex: 1;
  position: relative;
}

.skeleton-row-sm {
  height: 16px;
  background-color: var(--skeleton-bg, rgba(0, 0, 0, 0.05));
  border-radius: 4px;
  width: 80%;
  margin-bottom: 10px;
  position: relative;
}

.skeleton-row-xs {
  height: 12px;
  background-color: var(--skeleton-bg, rgba(0, 0, 0, 0.05));
  border-radius: 4px;
  width: 50%;
  position: relative;
}


.stats-card.skeleton-card {
  display: flex;
  align-items: center;
  padding: var(--dashboard-modal-padding);
  animation: none;
  background-color: var(--card-bg-color);
  box-shadow: var(--card-shadow);
  border: 1px solid var(--border-color);
  position: relative;
}

.stats-card.skeleton-card::after {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  transform: translateX(-100%);
  background-image: linear-gradient(
          90deg,
          rgba(255, 255, 255, 0) 0,
          rgba(255, 255, 255, 0.2) 20%,
          rgba(255, 255, 255, 0.5) 60%,
          rgba(255, 255, 255, 0) 100%
  );
  animation: shimmer 2s infinite;
  z-index: 1;
}

.import-action .import-content .import-desc {
  color: var(--theme-text-secondary);
  font-size: 12px;
  line-height: 1.4;
}

.no-clients-message {
  padding: var(--dashboard-modal-body-padding);
  text-align: center;
  background-color: var(--dashboard-theme-tint-xs);
  border-radius: var(--dashboard-modal-item-radius);
  margin: 10px 0;
  border: 1px dashed rgba(var(--theme-color-rgb), 0.3);
}

.no-clients-message p {
  color: var(--theme-text-primary);
  font-size: 14px;
  margin: 0;
}


.platform-selector {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  flex-wrap: wrap;
  justify-content: center;

  .platform-button {
    display: flex;
    align-items: center;
    gap: var(--mobile-grid-gap);
    background-color: var(--dashboard-theme-tint-xs);
    border: 1px solid var(--border-color);
    border-radius: 20px;
    padding: var(--dashboard-modal-cancel-padding);
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all var(--dashboard-transition-normal) var(--dashboard-transition-ease);
    color: var(--theme-text-primary);

    &:hover {
      background-color: var(--dashboard-theme-tint-sm);
      transform: translateY(-1px);
      border-color: rgba(var(--theme-color-rgb), 0.2);
    }

    &.active {
      background-color: rgba(var(--theme-color-rgb), 0.15);
      color: var(--theme-color);
      border-color: var(--theme-color);
      font-weight: 600;
      box-shadow: 0 2px 6px rgba(var(--theme-color-rgb), 0.2);
    }

    svg {
      color: var(--theme-color);
      opacity: 0.8;
    }
  }
}


@media (min-width: 1200px) {
  .stats-card.no-plan-card {
    padding: 25px 30px;
  }

  .no-plan-content {
    gap: 30px;
  }

  .no-plan-title {
    font-size: 1.3rem;
  }

  .no-plan-actions .action-button {
    padding: 12px 22px;
    font-size: 16px;
  }
}


.no-plan-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.no-plan-actions .action-button {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 18px;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  transition: all var(--dashboard-transition-normal) var(--dashboard-transition-ease);
}


@media screen and (min-width: 769px) {
  .no-plan-content {
    display: flex;
    align-items: center;
    gap: 24px;
    position: relative;
    z-index: 1;
    flex-direction: row;
  }

  .no-plan-message {
    flex: 1;
    text-align: left;
    align-items: flex-start;
    width: auto;
  }

  .no-plan-title {
    text-align: left;
    width: auto;
  }

  .no-plan-actions {
    justify-content: flex-start;
    width: auto;
    flex-direction: row;
  }

  .no-plan-actions .action-button {
    width: auto;
    max-width: none;
  }
}


.notice-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--dashboard-modal-body-padding);
  box-sizing: border-box;
  backdrop-filter: blur(4px);
}

.notice-modal {
  width: 100%;
  max-width: 500px;
  background-color: rgba(var(--card-background-rgb, 255, 255, 255), 1);
  border-radius: 16px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);
  border: 1px solid rgba(var(--theme-color-rgb), 0.15);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  max-height: 80vh;
  animation: modal-in 0.3s cubic-bezier(0.16, 1, 0.3, 1);

}

.notice-modal-header {
  padding: var(--dashboard-modal-body-padding);
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid var(--border-color);
  background-color: rgba(var(--theme-color-rgb), 0.03);

  .popup-title {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
    color: var(--theme-text-primary);
  }

  .popup-close-btn {
    background: none;
    border: none;
    cursor: pointer;
    color: var(--theme-text-secondary);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 8px;
    margin: -8px;
    border-radius: 50%;
    transition: all var(--dashboard-transition-normal) var(--dashboard-transition-ease);

    &:hover {
      background-color: rgba(0, 0, 0, 0.05);
      color: var(--theme-text-primary);
      transform: rotate(90deg);
    }
  }
}

.notice-modal-content {
  padding: var(--dashboard-modal-body-padding);
  overflow-y: auto;
  flex: 1;
  background: linear-gradient(to bottom, rgba(var(--theme-color-rgb), 0.02), transparent);

  .notice-content {
    font-size: 14px;
    line-height: 1.6;

    :deep(p) {
      margin: 12px 0;
      line-height: 1.6;
      color: var(--theme-text-primary);
    }

    :deep(strong) {
      color: var(--theme-color);
      font-weight: 600;
    }

    :deep(a) {
      color: var(--theme-color);
      text-decoration: none;

      &:hover {
        text-decoration: underline;
      }
    }

    :deep(img) {
      max-width: 100%;
      height: auto;
      margin: 10px 0;
      border-radius: var(--dashboard-modal-action-radius);
    }

    :deep(ul), :deep(ol) {
      padding-left: 20px;
      margin-bottom: 16px;

      li {
        margin-bottom: 8px;
        list-style-position: outside;
      }
    }

    :deep(ul) li {
      list-style-type: disc;
    }

    :deep(ol) li {
      list-style-type: decimal;
    }

    :deep(h1), :deep(h2), :deep(h3), :deep(h4), :deep(h5), :deep(h6) {
      margin-top: 24px;
      margin-bottom: 16px;
      font-weight: 600;
    }

    :deep(blockquote) {
      border-left: 4px solid var(--theme-color);
      padding: 10px 15px;
      margin: 16px 0;
      background-color: var(--dashboard-theme-tint-xs);
      border-radius: 0 6px 6px 0;

      p {
        margin: 8px 0;
      }
    }

    :deep(code) {
      font-family: monospace;
      background-color: var(--dashboard-theme-tint-sm);
      padding: 2px 4px;
      border-radius: 4px;
      font-size: 0.9em;
    }

    :deep(pre) {
      background-color: var(--dashboard-theme-tint-xs);
      padding: 12px;
      border-radius: var(--dashboard-modal-action-radius);
      overflow-x: auto;
      margin: 16px 0;

      code {
        background-color: transparent;
        padding: 0;
      }
    }

    :deep(table) {
      width: 100%;
      border-collapse: collapse;
      margin: 16px 0;

      th, td {
        border: 1px solid var(--border-color);
        padding: var(--dashboard-modal-action-padding);
        text-align: left;
      }

      th {
        background-color: var(--dashboard-theme-tint-xs);
        font-weight: 600;
      }

      tr:nth-child(even) {
        background-color: var(--dashboard-theme-tint-xxs);
      }
    }

    :deep(a.eztheme-btn) {
      display: inline-block;
      padding: var(--dashboard-modal-cancel-padding);
      background-color: var(--theme-color);
      color: white;
      border-radius: var(--dashboard-modal-action-radius);
      margin: 10px 0;
      text-decoration: none;
      transition: all var(--dashboard-transition-normal) var(--dashboard-transition-ease);

      &:hover {
        background-color: var(--primary-color-hover);
        transform: translateY(-2px);
        box-shadow: 0 4px 8px rgba(var(--theme-color-rgb), 0.3);
      }
    }
  }
}

.notice-modal-footer {
  padding: 15px 20px;
  border-top: 1px solid var(--border-color);
  display: flex;
  justify-content: flex-end;

  .popup-action-btn {
    padding: 8px 20px;
    background-color: var(--theme-color);
    color: white;
    border: none;
    border-radius: var(--dashboard-modal-action-radius);
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all var(--dashboard-transition-normal) var(--dashboard-transition-ease);
    min-width: 120px;

    &.adaptive-btn {
      min-width: auto;
      padding: 8px 20px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }

    &:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 4px 10px rgba(var(--theme-color-rgb), 0.3);
    }

    &:disabled {
      opacity: 0.7;
      cursor: not-allowed;
      background-color: var(--theme-text-secondary);
    }
  }
}

.popup-slide-enter-active {
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.popup-slide-leave-active {
  transition: all var(--dashboard-transition-fast) var(--dashboard-transition-ease-out);
}

.popup-slide-enter-from {
  opacity: 0;
  transform: translateY(20px) scale(0.98);
}

.popup-slide-leave-to {
  opacity: 0;
  transform: scale(0.95);
}


@media (max-width: 768px) {
  .notice-modal-overlay {
    padding: 15px;

    .notice-modal {
      max-width: 100%;
      max-height: 85vh;

      .notice-modal-header {
        padding: 15px;

        .popup-title {
          font-size: 16px;
        }
      }

      .notice-modal-content {
        padding: 15px;
      }

      .notice-modal-footer {
        padding: 12px 15px;
      }
    }
  }
}



.traffic-package-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--dashboard-overlay-dark);
  z-index: var(--dashboard-modal-z);
  padding: var(--dashboard-modal-padding);
}

.traffic-package-container {
  width: min(100%, var(--dashboard-modal-max-width));
  max-height: calc(100vh - var(--dashboard-modal-viewport-gap));
}

.traffic-package-modal-card {
  max-height: calc(100vh - var(--dashboard-modal-viewport-gap));

  .modal-header {
    padding: var(--dashboard-modal-header-padding);
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid var(--border-color);

    h3 {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
      color: var(--theme-text-primary);
    }

    .close-button {
      background: none;
      border: none;
      font-size: 24px;
      color: var(--theme-text-secondary);
      cursor: pointer;
      padding: 0;

      &:hover {
        color: var(--theme-text-primary);
      }
    }
  }

  .modal-body {
    display: block;
    padding: var(--dashboard-modal-body-padding);
    overflow-y: auto;
  }

  .traffic-package-desc {
    margin: 0 0 14px;
    color: var(--theme-text-secondary);
    font-size: 14px;
    line-height: 1.5;
  }

  .traffic-package-loading,
  .traffic-package-empty {
    text-align: center;
    color: var(--theme-text-secondary);
    padding: 28px 0;
  }

  .traffic-package-list {
    display: flex;
    flex-direction: column;
    gap: var(--dashboard-overview-gap-mobile);
  }

  .traffic-package-item {
    border: 1px solid var(--border-color);
    border-radius: var(--dashboard-modal-item-radius);
    padding: var(--dashboard-modal-item-padding);
    display: flex;
    flex-direction: column;
    gap: var(--dashboard-overview-gap-mobile);
    background: linear-gradient(
        180deg,
        var(--dashboard-soft-tint-strong) 0%,
        var(--dashboard-soft-tint-light) 100%
    );

    .item-title-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: var(--dashboard-overview-gap-mobile);

      strong {
        font-size: 15px;
        font-weight: 600;
        color: var(--theme-text-primary);
      }
    }

    .item-price {
      font-size: 24px;
      font-weight: 700;
      color: var(--theme-color);
    }

    .item-content {
      color: var(--theme-text-secondary);
      font-size: 13px;
      line-height: 1.45;
      min-height: var(--dashboard-modal-viewport-gap);
    }

    .buy-btn {
      width: 100%;
      justify-content: center;
      margin-top: auto;
      padding: var(--dashboard-modal-action-padding);
      border: none;
      border-radius: var(--dashboard-modal-action-radius);
      font-size: 14px;
      font-weight: 500;
      background-color: var(--dashboard-theme-solid-soft);
      color: var(--dashboard-text-inverse);
      cursor: pointer;
      transition: all var(--dashboard-transition-normal) var(--dashboard-transition-ease);

      &:hover:not(:disabled) {
        transform: translateY(-2px);
        box-shadow: 0 4px 10px rgba(var(--theme-color-rgb), 0.3);
      }

      &:disabled {
        opacity: 0.75;
        cursor: not-allowed;
      }
    }
  }

  .modal-footer {
    padding: var(--dashboard-modal-footer-padding);
    border-top: 1px solid var(--border-color);
    display: flex;
    justify-content: flex-end;

    .cancel-btn {
      padding: var(--dashboard-modal-cancel-padding);
      border-radius: var(--dashboard-modal-action-radius);
      border: 1px solid var(--border-color);
      background-color: transparent;
      color: var(--theme-text-primary);
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: all var(--dashboard-transition-normal) var(--dashboard-transition-ease);

      &:hover {
        background-color: var(--dashboard-soft-tint-strong);
      }
    }
  }
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: var(--dashboard-overlay-dark);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-container {
  width: 90%;
  max-width: 400px;
  max-height: 90vh;
  border-radius: var(--dashboard-modal-item-radius);
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.modal-card {
  background-color: var(--card-background);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.reset-traffic-modal {
  .modal-header {
    padding: var(--dashboard-modal-footer-padding);
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid var(--border-color);

    h3 {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
      color: var(--theme-text-primary);
    }

    .close-button {
      background: none;
      border: none;
      font-size: 24px;
      color: var(--theme-text-secondary);
      cursor: pointer;
      padding: 0;

      &:hover {
        color: var(--theme-text-primary);
      }
    }
  }

  .modal-body {
    padding: var(--dashboard-modal-body-padding);
    display: flex;
    flex-direction: column;
    align-items: center;

    .warning-icon {
      margin-bottom: 16px;
      color: color-mix(in srgb, var(--theme-color) 85%, #fff 15%);
    }

    .warning-text {
      font-size: 16px;
      line-height: 1.5;
      margin-bottom: 12px;
      text-align: center;
      color: var(--theme-text-primary);
    }

    .note-text {
      font-size: 14px;
      color: var(--theme-text-secondary);
      text-align: center;
      margin-bottom: 0;
      padding: var(--dashboard-modal-action-padding);
      background-color: var(--dashboard-theme-tint-xs);
      border-radius: var(--dashboard-modal-action-radius);
      width: 100%;
    }
  }

  .modal-footer {
    padding: var(--dashboard-modal-footer-padding);
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    border-top: 1px solid var(--border-color);

    button {
      padding: var(--dashboard-modal-cancel-padding);
      border-radius: var(--dashboard-modal-action-radius);
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: all var(--dashboard-transition-normal) var(--dashboard-transition-ease);

      &:disabled {
        opacity: 0.7;
        cursor: not-allowed;
        transform: none !important;
      }
    }

    .cancel-btn {
      background-color: transparent;
      border: 1px solid var(--border-color);
      color: var(--theme-text-primary);

      &:hover:not(:disabled) {
        background-color: rgba(0, 0, 0, 0.05);
      }
    }

    .confirm-btn {
      background-color: var(--dashboard-theme-solid-soft);
      color: white;
      border: none;

      &:hover:not(:disabled) {
        background-color: var(--dashboard-theme-solid-soft);
        transform: translateY(-2px);
        box-shadow: 0 4px 8px rgba(244, 67, 54, 0.3);
      }
    }
  }
}


.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity var(--dashboard-transition-normal) var(--dashboard-transition-ease);
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}


.loader-small {
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid var(--dashboard-spinner-track);
  border-radius: 50%;
  border-top: 2px solid var(--dashboard-text-inverse);
  animation: spin 1s linear infinite;
  margin-right: 8px;
}


.loading-container {
  display: flex;
  align-items: center;
  justify-content: center;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

}
























</style>

<!-- 全局样式，不受scoped限制 -->
<style lang="scss">
@use '@/assets/styles/dashboard-global-overrides';
</style>
