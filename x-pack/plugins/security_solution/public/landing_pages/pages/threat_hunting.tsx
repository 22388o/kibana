/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */
import React from 'react';
import { SecurityPageName } from '../../app/types';
import { HeaderPage } from '../../common/components/header_page';
import { useAppRootNavLink } from '../../common/components/navigation/nav_links';
import { SecuritySolutionPageWrapper } from '../../common/components/page_wrapper';
import { SpyRoute } from '../../common/utils/route/spy_routes';
import { LandingLinksImages } from '../components/landing_links_images';
import { THREAT_HUNTING_PAGE_TITLE } from './translations';

export const ThreatHuntingLandingPage = () => {
  const threatHuntinglinks = useAppRootNavLink(SecurityPageName.threatHuntingLanding)?.links ?? [];

  return (
    <SecuritySolutionPageWrapper>
      <HeaderPage title={THREAT_HUNTING_PAGE_TITLE} />
      <LandingLinksImages items={threatHuntinglinks} />
      <SpyRoute pageName={SecurityPageName.threatHuntingLanding} />
    </SecuritySolutionPageWrapper>
  );
};
