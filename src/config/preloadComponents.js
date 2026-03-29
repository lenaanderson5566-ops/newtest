const getAuthComponent = (authLayoutType, componentName) => () =>
  authLayoutType === 'split'
    ? import(`@/views/auth/split/${componentName}.vue`)
    : import(`@/views/auth/center/${componentName}.vue`);

export function createPreloadComponentsConfig(authLayoutType, loaders) {
  const {
    dashboardComponent,
    profileComponent,
    shopComponent,
    inviteComponent,
    orderListComponent,
    paymentComponent,
    orderConfirmComponent,
    configManagementComponent,
    ticketListComponent,
    mobileTicketListComponent,
    walletDepositComponent,
    docsPageComponent,
    docDetailComponent,
    securitySettingsComponent,
  } = loaders;

  return {
    base: [
      { path: 'Dashboard', name: 'Dashboard', priority: 1, component: dashboardComponent },
      { path: 'Shop', name: 'Shop', priority: 2, component: shopComponent },
      { path: 'Invite', name: 'Invite', priority: 4, component: inviteComponent },
      { path: 'Profile', name: 'Profile', priority: 5, component: profileComponent }
    ],

    route: {
      '/': [
        { path: 'Login', name: 'Login', priority: 1, component: getAuthComponent(authLayoutType, 'Login') },
        { path: 'Register', name: 'Register', priority: 2, component: getAuthComponent(authLayoutType, 'Register') },
        { path: 'ForgotPassword', name: 'ForgotPassword', priority: 3, component: getAuthComponent(authLayoutType, 'ForgotPassword') }
      ],
      '/landing': [
        { path: 'Login', name: 'Login', priority: 1, component: getAuthComponent(authLayoutType, 'Login') },
        { path: 'Register', name: 'Register', priority: 2, component: getAuthComponent(authLayoutType, 'Register') },
        { path: 'ForgotPassword', name: 'ForgotPassword', priority: 3, component: getAuthComponent(authLayoutType, 'ForgotPassword') }
      ],
      '/login': [
        { path: 'Register', name: 'Register', priority: 1, component: getAuthComponent(authLayoutType, 'Register') },
        { path: 'ForgotPassword', name: 'ForgotPassword', priority: 2, component: getAuthComponent(authLayoutType, 'ForgotPassword') },
        { path: 'Dashboard', name: 'Dashboard', priority: 3, component: dashboardComponent }
      ],
      '/register': [
        { path: 'Login', name: 'Login', priority: 1, component: getAuthComponent(authLayoutType, 'Login') },
        { path: 'ForgotPassword', name: 'ForgotPassword', priority: 2, component: getAuthComponent(authLayoutType, 'ForgotPassword') },
        { path: 'Dashboard', name: 'Dashboard', priority: 3, component: dashboardComponent }
      ],
      '/forgot-password': [
        { path: 'Login', name: 'Login', priority: 1, component: getAuthComponent(authLayoutType, 'Login') },
        { path: 'Register', name: 'Register', priority: 2, component: getAuthComponent(authLayoutType, 'Register') },
        { path: 'Dashboard', name: 'Dashboard', priority: 3, component: dashboardComponent }
      ],
      '/dashboard': [
        { path: 'Shop', name: 'Shop', priority: 1, component: shopComponent },
        { path: 'Invite', name: 'Invite', priority: 3, component: inviteComponent },
        { path: 'Profile', name: 'Profile', priority: 4, component: profileComponent },
        { path: 'OrderList', name: 'OrderList', priority: 5, component: orderListComponent },
        { path: 'Payment', name: 'Payment', priority: 6, component: paymentComponent }
      ],
      '/shop': [
        { path: 'OrderConfirm', name: 'OrderConfirm', priority: 1, component: orderConfirmComponent },
        { path: 'Payment', name: 'Payment', priority: 2, component: paymentComponent },
        { path: 'Dashboard', name: 'Dashboard', priority: 3, component: dashboardComponent },
        { path: 'OrderList', name: 'OrderList', priority: 5, component: orderListComponent }
      ],
      '/profile': [
        { path: 'Dashboard', name: 'Dashboard', priority: 1, component: dashboardComponent },
        { path: 'ConfigManagement', name: 'ConfigManagement', priority: 1, component: configManagementComponent },
        { path: 'Shop', name: 'Shop', priority: 2, component: shopComponent },
        { path: 'TicketList', name: 'TicketList', priority: 4, component: ticketListComponent },
        { path: 'Profile', name: 'Profile', priority: 5, component: profileComponent },
        { path: 'SecuritySettings', name: 'SecuritySettings', priority: 6, component: securitySettingsComponent }
      ],
      '/tickets': [
        { path: 'Profile', name: 'Profile', priority: 1, component: profileComponent },
        { path: 'Dashboard', name: 'Dashboard', priority: 2, component: dashboardComponent },
        { path: 'MobileTickets', name: 'MobileTickets', priority: 3, component: mobileTicketListComponent }
      ],
      '/mobile/tickets': [
        { path: 'TicketList', name: 'TicketList', priority: 1, component: ticketListComponent },
        { path: 'Dashboard', name: 'Dashboard', priority: 2, component: dashboardComponent }
      ],
      '/billing': [
        { path: 'OrderList', name: 'OrderList', priority: 1, component: orderListComponent },
        { path: 'WalletDeposit', name: 'WalletDeposit', priority: 2, component: walletDepositComponent },
        { path: 'Invite', name: 'Invite', priority: 3, component: inviteComponent },
        { path: 'Dashboard', name: 'Dashboard', priority: 4, component: dashboardComponent }
      ],
      '/orders': [
        { path: 'Shop', name: 'Shop', priority: 1, component: shopComponent },
        { path: 'Payment', name: 'Payment', priority: 2, component: paymentComponent },
        { path: 'Dashboard', name: 'Dashboard', priority: 3, component: dashboardComponent }
      ],
      '/nodes': [
        { path: 'Dashboard', name: 'Dashboard', priority: 1, component: dashboardComponent },
      ],
      '/docs': [
        { path: 'DocDetail', name: 'DocDetail', priority: 2, component: docDetailComponent },
        { path: 'Dashboard', name: 'Dashboard', priority: 3, component: dashboardComponent }
      ],
      '/quick-start': [
        { path: 'Docs', name: 'Docs', priority: 1, component: docsPageComponent },
        { path: 'Dashboard', name: 'Dashboard', priority: 2, component: dashboardComponent }
      ],
      '/docs/:id': [
        { path: 'Docs', name: 'Docs', priority: 1, component: docsPageComponent },
      ],
      '/trafficlog': [
        { path: 'Dashboard', name: 'Dashboard', priority: 1, component: dashboardComponent },
        { path: 'Profile', name: 'Profile', priority: 3, component: profileComponent }
      ],
      '/wallet/deposit': [
        { path: 'Dashboard', name: 'Dashboard', priority: 1, component: dashboardComponent },
        { path: 'Shop', name: 'Shop', priority: 2, component: shopComponent },
        { path: 'Profile', name: 'Profile', priority: 3, component: profileComponent }
      ],
      '/security-settings': [
        { path: 'Profile', name: 'Profile', priority: 1, component: profileComponent },
        { path: 'Dashboard', name: 'Dashboard', priority: 2, component: dashboardComponent }
      ],
      '/config-management': [
        { path: 'Profile', name: 'Profile', priority: 1, component: profileComponent },
        { path: 'Dashboard', name: 'Dashboard', priority: 2, component: dashboardComponent }
      ],
      '/payment': [
        { path: 'OrderConfirm', name: 'OrderConfirm', priority: 1, component: orderConfirmComponent },
        { path: 'Shop', name: 'Shop', priority: 2, component: shopComponent },
        { path: 'Dashboard', name: 'Dashboard', priority: 3, component: dashboardComponent }
      ],
      '/order-confirm': [
        { path: 'Shop', name: 'Shop', priority: 1, component: shopComponent },
        { path: 'Payment', name: 'Payment', priority: 2, component: paymentComponent }
      ],
    }
  };
}
