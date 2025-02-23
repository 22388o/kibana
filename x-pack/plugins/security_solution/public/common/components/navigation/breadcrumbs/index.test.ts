/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import '../../../mock/match_media';
import { encodeIpv6 } from '../../../lib/helpers';
import { getBreadcrumbsForRoute, ObjectWithNavTabs, useSetBreadcrumbs } from '.';
import { HostsTableType } from '../../../../hosts/store/model';
import { RouteSpyState, SiemRouteType } from '../../../utils/route/types';
import { NetworkRouteType } from '../../../../network/pages/navigation/types';
import { TimelineTabs } from '../../../../../common/types/timeline';
import { AdministrationSubTab } from '../../../../management/types';
import { renderHook } from '@testing-library/react-hooks';
import { TestProviders } from '../../../mock';
import { GetSecuritySolutionUrl } from '../../link_to';
import { APP_UI_ID } from '../../../../../common/constants';
import { useDeepEqualSelector } from '../../../hooks/use_selector';
import { useIsGroupedNavigationEnabled } from '../helpers';
import { navTabs } from '../../../../app/home/home_navigations';
import { getAppLinks } from '../../../links/app_links';
import { allowedExperimentalValues } from '../../../../../common/experimental_features';
import { StartPlugins } from '../../../../types';
import { coreMock } from '@kbn/core/public/mocks';
import { updateAppLinks } from '../../../links';

jest.mock('../../../hooks/use_selector');

const mockUseIsGroupedNavigationEnabled = useIsGroupedNavigationEnabled as jest.Mock;
jest.mock('../helpers', () => {
  const original = jest.requireActual('../helpers');
  return {
    ...original,
    useIsGroupedNavigationEnabled: jest.fn(),
  };
});

const setBreadcrumbsMock = jest.fn();
const chromeMock = {
  setBreadcrumbs: setBreadcrumbsMock,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
} as any;

const mockDefaultTab = (pageName: string): SiemRouteType | undefined => {
  switch (pageName) {
    case 'hosts':
      return HostsTableType.authentications;
    case 'network':
      return NetworkRouteType.flows;
    case 'administration':
      return AdministrationSubTab.endpoints;
    default:
      return undefined;
  }
};

const getMockObject = (
  pageName: string,
  pathName: string,
  detailName: string | undefined
): RouteSpyState & ObjectWithNavTabs => ({
  detailName,
  navTabs,
  pageName,
  pathName,
  search: '',
  tabName: mockDefaultTab(pageName) as HostsTableType,
});

(useDeepEqualSelector as jest.Mock).mockImplementation(() => {
  return {
    urlState: {
      query: { query: '', language: 'kuery' },
      filters: [],
      timeline: {
        activeTab: TimelineTabs.query,
        id: '',
        isOpen: false,
        graphEventId: '',
      },
      timerange: {
        global: {
          linkTo: ['timeline'],
          timerange: {
            from: '2019-05-16T23:10:43.696Z',
            fromStr: 'now-24h',
            kind: 'relative',
            to: '2019-05-17T23:10:43.697Z',
            toStr: 'now',
          },
        },
        timeline: {
          linkTo: ['global'],
          timerange: {
            from: '2019-05-16T23:10:43.696Z',
            fromStr: 'now-24h',
            kind: 'relative',
            to: '2019-05-17T23:10:43.697Z',
            toStr: 'now',
          },
        },
      },
      sourcerer: {},
    },
  };
});

// The string returned is different from what getSecuritySolutionUrl returns, but does not matter for the purposes of this test.
const getSecuritySolutionUrl: GetSecuritySolutionUrl = ({
  deepLinkId,
  path,
}: {
  deepLinkId?: string;
  path?: string;
  absolute?: boolean;
}) => `${APP_UI_ID}${deepLinkId ? `/${deepLinkId}` : ''}${path ?? ''}`;

jest.mock('../../../lib/kibana/kibana_react', () => {
  return {
    useKibana: () => ({
      services: {
        chrome: undefined,
        application: {
          navigateToApp: jest.fn(),
          getUrlForApp: (appId: string, options?: { path?: string; deepLinkId?: boolean }) =>
            `${appId}/${options?.deepLinkId ?? ''}${options?.path ?? ''}`,
        },
      },
    }),
  };
});

describe('Navigation Breadcrumbs', () => {
  beforeAll(async () => {
    const appLinks = await getAppLinks(coreMock.createStart(), {} as StartPlugins);
    updateAppLinks(appLinks, {
      experimentalFeatures: allowedExperimentalValues,
      capabilities: {
        navLinks: {},
        management: {},
        catalogue: {},
        actions: { show: true, crud: true },
        siem: {
          show: true,
          crud: true,
        },
      },
    });
  });

  const hostName = 'siem-kibana';

  const ipv4 = '192.0.2.255';
  const ipv6 = '2001:db8:ffff:ffff:ffff:ffff:ffff:ffff';
  const ipv6Encoded = encodeIpv6(ipv6);

  describe('Old Architecture', () => {
    beforeAll(() => {
      mockUseIsGroupedNavigationEnabled.mockReturnValue(false);
    });

    describe('getBreadcrumbsForRoute', () => {
      test('should return Overview breadcrumbs when supplied overview pageName', () => {
        const breadcrumbs = getBreadcrumbsForRoute(
          getMockObject('overview', '/', undefined),
          getSecuritySolutionUrl,
          false
        );
        expect(breadcrumbs).toEqual([
          {
            href: 'securitySolutionUI/get_started',
            text: 'Security',
          },
          {
            href: '',
            text: 'Overview',
          },
        ]);
      });

      test('should return Host breadcrumbs when supplied hosts pageName', () => {
        const breadcrumbs = getBreadcrumbsForRoute(
          getMockObject('hosts', '/', undefined),
          getSecuritySolutionUrl,
          false
        );
        expect(breadcrumbs).toEqual([
          {
            href: 'securitySolutionUI/get_started',
            text: 'Security',
          },
          {
            href: 'securitySolutionUI/hosts',
            text: 'Hosts',
          },
          {
            href: '',
            text: 'Authentications',
          },
        ]);
      });

      test('should return Network breadcrumbs when supplied network pageName', () => {
        const breadcrumbs = getBreadcrumbsForRoute(
          getMockObject('network', '/', undefined),
          getSecuritySolutionUrl,
          false
        );
        expect(breadcrumbs).toEqual([
          { text: 'Security', href: 'securitySolutionUI/get_started' },
          {
            text: 'Network',
            href: 'securitySolutionUI/network',
          },
          {
            text: 'Flows',
            href: '',
          },
        ]);
      });

      test('should return Timelines breadcrumbs when supplied timelines pageName', () => {
        const breadcrumbs = getBreadcrumbsForRoute(
          getMockObject('timelines', '/', undefined),
          getSecuritySolutionUrl,
          false
        );
        expect(breadcrumbs).toEqual([
          { text: 'Security', href: 'securitySolutionUI/get_started' },
          {
            text: 'Timelines',
            href: '',
          },
        ]);
      });

      test('should return Host Details breadcrumbs when supplied a pathname with hostName', () => {
        const breadcrumbs = getBreadcrumbsForRoute(
          getMockObject('hosts', '/', hostName),
          getSecuritySolutionUrl,
          false
        );
        expect(breadcrumbs).toEqual([
          { text: 'Security', href: 'securitySolutionUI/get_started' },
          {
            text: 'Hosts',
            href: 'securitySolutionUI/hosts',
          },
          {
            text: 'siem-kibana',
            href: 'securitySolutionUI/hosts/siem-kibana',
          },
          { text: 'Authentications', href: '' },
        ]);
      });

      test('should return IP Details breadcrumbs when supplied pathname with ipv4', () => {
        const breadcrumbs = getBreadcrumbsForRoute(
          getMockObject('network', '/', ipv4),
          getSecuritySolutionUrl,
          false
        );
        expect(breadcrumbs).toEqual([
          { text: 'Security', href: 'securitySolutionUI/get_started' },
          {
            text: 'Network',
            href: 'securitySolutionUI/network',
          },
          {
            text: ipv4,
            href: `securitySolutionUI/network/ip/${ipv4}/source`,
          },
          { text: 'Flows', href: '' },
        ]);
      });

      test('should return IP Details breadcrumbs when supplied pathname with ipv6', () => {
        const breadcrumbs = getBreadcrumbsForRoute(
          getMockObject('network', '/', ipv6Encoded),
          getSecuritySolutionUrl,
          false
        );
        expect(breadcrumbs).toEqual([
          { text: 'Security', href: 'securitySolutionUI/get_started' },
          {
            text: 'Network',
            href: 'securitySolutionUI/network',
          },
          {
            text: ipv6,
            href: `securitySolutionUI/network/ip/${ipv6Encoded}/source`,
          },
          { text: 'Flows', href: '' },
        ]);
      });

      test('should return Alerts breadcrumbs when supplied alerts pageName', () => {
        const breadcrumbs = getBreadcrumbsForRoute(
          getMockObject('alerts', '/alerts', undefined),
          getSecuritySolutionUrl,
          false
        );
        expect(breadcrumbs).toEqual([
          { text: 'Security', href: 'securitySolutionUI/get_started' },
          {
            text: 'Alerts',
            href: '',
          },
        ]);
      });

      test('should return Exceptions breadcrumbs when supplied exceptions pageName', () => {
        const breadcrumbs = getBreadcrumbsForRoute(
          getMockObject('exceptions', '/exceptions', undefined),
          getSecuritySolutionUrl,
          false
        );
        expect(breadcrumbs).toEqual([
          { text: 'Security', href: 'securitySolutionUI/get_started' },
          {
            text: 'Exception lists',
            href: '',
          },
        ]);
      });

      test('should return Rules breadcrumbs when supplied rules pageName', () => {
        const breadcrumbs = getBreadcrumbsForRoute(
          getMockObject('rules', '/rules', undefined),
          getSecuritySolutionUrl,
          false
        );
        expect(breadcrumbs).toEqual([
          { text: 'Security', href: 'securitySolutionUI/get_started' },
          {
            text: 'Rules',
            href: '',
          },
        ]);
      });

      test('should return Rules breadcrumbs when supplied rules Creation pageName', () => {
        const breadcrumbs = getBreadcrumbsForRoute(
          getMockObject('rules', '/rules/create', undefined),
          getSecuritySolutionUrl,
          false
        );
        expect(breadcrumbs).toEqual([
          { text: 'Security', href: 'securitySolutionUI/get_started' },
          {
            text: 'Rules',
            href: 'securitySolutionUI/rules',
          },
          {
            text: 'Create',
            href: '',
          },
        ]);
      });

      test('should return Rules breadcrumbs when supplied rules Details pageName', () => {
        const mockDetailName = '5a4a0460-d822-11eb-8962-bfd4aff0a9b3';
        const mockRuleName = 'ALERT_RULE_NAME';
        const breadcrumbs = getBreadcrumbsForRoute(
          {
            ...getMockObject('rules', `/rules/id/${mockDetailName}`, undefined),
            detailName: mockDetailName,
            state: {
              ruleName: mockRuleName,
            },
          },
          getSecuritySolutionUrl,
          false
        );
        expect(breadcrumbs).toEqual([
          { text: 'Security', href: 'securitySolutionUI/get_started' },
          {
            text: 'Rules',
            href: 'securitySolutionUI/rules',
          },
          {
            text: mockRuleName,
            href: ``,
          },
        ]);
      });

      test('should return Rules breadcrumbs when supplied rules Edit pageName', () => {
        const mockDetailName = '5a4a0460-d822-11eb-8962-bfd4aff0a9b3';
        const mockRuleName = 'ALERT_RULE_NAME';
        const breadcrumbs = getBreadcrumbsForRoute(
          {
            ...getMockObject('rules', `/rules/id/${mockDetailName}/edit`, undefined),
            detailName: mockDetailName,
            state: {
              ruleName: mockRuleName,
            },
          },
          getSecuritySolutionUrl,
          false
        );
        expect(breadcrumbs).toEqual([
          { text: 'Security', href: 'securitySolutionUI/get_started' },
          {
            text: 'Rules',
            href: 'securitySolutionUI/rules',
          },
          {
            text: 'ALERT_RULE_NAME',
            href: `securitySolutionUI/rules/id/${mockDetailName}`,
          },
          {
            text: 'Edit',
            href: '',
          },
        ]);
      });

      test('should return null breadcrumbs when supplied Cases pageName', () => {
        const breadcrumbs = getBreadcrumbsForRoute(
          getMockObject('cases', '/', undefined),
          getSecuritySolutionUrl,
          false
        );
        expect(breadcrumbs).toEqual(null);
      });

      test('should return null breadcrumbs when supplied Cases details pageName', () => {
        const sampleCase = {
          id: 'my-case-id',
          name: 'Case name',
        };
        const breadcrumbs = getBreadcrumbsForRoute(
          {
            ...getMockObject('cases', `/${sampleCase.id}`, sampleCase.id),
            state: { caseTitle: sampleCase.name },
          },
          getSecuritySolutionUrl,
          false
        );
        expect(breadcrumbs).toEqual(null);
      });

      test('should return Admin breadcrumbs when supplied endpoints pageName', () => {
        const breadcrumbs = getBreadcrumbsForRoute(
          getMockObject('administration', '/endpoints', undefined),
          getSecuritySolutionUrl,
          false
        );

        expect(breadcrumbs).toEqual([
          { text: 'Security', href: 'securitySolutionUI/get_started' },
          {
            text: 'Endpoints',
            href: '',
          },
        ]);
      });
    });

    describe('setBreadcrumbs()', () => {
      test('should call chrome breadcrumb service with correct breadcrumbs', () => {
        const navigateToUrlMock = jest.fn();
        const { result } = renderHook(() => useSetBreadcrumbs(), { wrapper: TestProviders });
        result.current(getMockObject('hosts', '/', hostName), chromeMock, navigateToUrlMock);

        expect(setBreadcrumbsMock).toBeCalledWith([
          expect.objectContaining({
            text: 'Security',
            href: "securitySolutionUI/get_started?sourcerer=()&timerange=(global:(linkTo:!(timeline),timerange:(from:'2019-05-16T23:10:43.696Z',fromStr:now-24h,kind:relative,to:'2019-05-17T23:10:43.697Z',toStr:now)),timeline:(linkTo:!(global),timerange:(from:'2019-05-16T23:10:43.696Z',fromStr:now-24h,kind:relative,to:'2019-05-17T23:10:43.697Z',toStr:now)))",
            onClick: expect.any(Function),
          }),
          expect.objectContaining({
            text: 'Hosts',
            href: "securitySolutionUI/hosts?sourcerer=()&timerange=(global:(linkTo:!(timeline),timerange:(from:'2019-05-16T23:10:43.696Z',fromStr:now-24h,kind:relative,to:'2019-05-17T23:10:43.697Z',toStr:now)),timeline:(linkTo:!(global),timerange:(from:'2019-05-16T23:10:43.696Z',fromStr:now-24h,kind:relative,to:'2019-05-17T23:10:43.697Z',toStr:now)))",
            onClick: expect.any(Function),
          }),
          expect.objectContaining({
            text: 'siem-kibana',
            href: "securitySolutionUI/hosts/siem-kibana?sourcerer=()&timerange=(global:(linkTo:!(timeline),timerange:(from:'2019-05-16T23:10:43.696Z',fromStr:now-24h,kind:relative,to:'2019-05-17T23:10:43.697Z',toStr:now)),timeline:(linkTo:!(global),timerange:(from:'2019-05-16T23:10:43.696Z',fromStr:now-24h,kind:relative,to:'2019-05-17T23:10:43.697Z',toStr:now)))",
            onClick: expect.any(Function),
          }),
          {
            text: 'Authentications',
            href: '',
          },
        ]);
      });
    });
  });

  describe('New Architecture', () => {
    beforeAll(() => {
      mockUseIsGroupedNavigationEnabled.mockReturnValue(true);
    });

    describe('getBreadcrumbsForRoute', () => {
      test('should return Overview breadcrumbs when supplied overview pageName', () => {
        const breadcrumbs = getBreadcrumbsForRoute(
          getMockObject('overview', '/', undefined),
          getSecuritySolutionUrl,
          true
        );
        expect(breadcrumbs).toEqual([
          {
            href: 'securitySolutionUI/get_started',
            text: 'Security',
          },
          {
            href: 'securitySolutionUI/dashboards',
            text: 'Dashboards',
          },
          {
            href: '',
            text: 'Overview',
          },
        ]);
      });

      test('should return Host breadcrumbs when supplied hosts pageName', () => {
        const breadcrumbs = getBreadcrumbsForRoute(
          getMockObject('hosts', '/', undefined),
          getSecuritySolutionUrl,
          true
        );
        expect(breadcrumbs).toEqual([
          {
            href: 'securitySolutionUI/get_started',
            text: 'Security',
          },
          {
            href: 'securitySolutionUI/threat_hunting',
            text: 'Threat Hunting',
          },
          {
            href: 'securitySolutionUI/hosts',
            text: 'Hosts',
          },
          {
            href: '',
            text: 'Authentications',
          },
        ]);
      });

      test('should return Network breadcrumbs when supplied network pageName', () => {
        const breadcrumbs = getBreadcrumbsForRoute(
          getMockObject('network', '/', undefined),
          getSecuritySolutionUrl,
          true
        );
        expect(breadcrumbs).toEqual([
          { text: 'Security', href: 'securitySolutionUI/get_started' },
          {
            href: 'securitySolutionUI/threat_hunting',
            text: 'Threat Hunting',
          },
          {
            text: 'Network',
            href: 'securitySolutionUI/network',
          },
          {
            text: 'Flows',
            href: '',
          },
        ]);
      });

      test('should return Timelines breadcrumbs when supplied timelines pageName', () => {
        const breadcrumbs = getBreadcrumbsForRoute(
          getMockObject('timelines', '/', undefined),
          getSecuritySolutionUrl,
          true
        );
        expect(breadcrumbs).toEqual([
          { text: 'Security', href: 'securitySolutionUI/get_started' },
          {
            text: 'Timelines',
            href: '',
          },
        ]);
      });

      test('should return Host Details breadcrumbs when supplied a pathname with hostName', () => {
        const breadcrumbs = getBreadcrumbsForRoute(
          getMockObject('hosts', '/', hostName),
          getSecuritySolutionUrl,
          true
        );
        expect(breadcrumbs).toEqual([
          { text: 'Security', href: 'securitySolutionUI/get_started' },
          {
            href: 'securitySolutionUI/threat_hunting',
            text: 'Threat Hunting',
          },
          {
            text: 'Hosts',
            href: 'securitySolutionUI/hosts',
          },
          {
            text: 'siem-kibana',
            href: 'securitySolutionUI/hosts/siem-kibana',
          },
          { text: 'Authentications', href: '' },
        ]);
      });

      test('should return IP Details breadcrumbs when supplied pathname with ipv4', () => {
        const breadcrumbs = getBreadcrumbsForRoute(
          getMockObject('network', '/', ipv4),
          getSecuritySolutionUrl,
          true
        );
        expect(breadcrumbs).toEqual([
          { text: 'Security', href: 'securitySolutionUI/get_started' },
          {
            href: 'securitySolutionUI/threat_hunting',
            text: 'Threat Hunting',
          },
          {
            text: 'Network',
            href: 'securitySolutionUI/network',
          },
          {
            text: ipv4,
            href: `securitySolutionUI/network/ip/${ipv4}/source`,
          },
          { text: 'Flows', href: '' },
        ]);
      });

      test('should return IP Details breadcrumbs when supplied pathname with ipv6', () => {
        const breadcrumbs = getBreadcrumbsForRoute(
          getMockObject('network', '/', ipv6Encoded),
          getSecuritySolutionUrl,
          true
        );
        expect(breadcrumbs).toEqual([
          { text: 'Security', href: 'securitySolutionUI/get_started' },
          {
            href: 'securitySolutionUI/threat_hunting',
            text: 'Threat Hunting',
          },
          {
            text: 'Network',
            href: 'securitySolutionUI/network',
          },
          {
            text: ipv6,
            href: `securitySolutionUI/network/ip/${ipv6Encoded}/source`,
          },
          { text: 'Flows', href: '' },
        ]);
      });

      test('should return Alerts breadcrumbs when supplied alerts pageName', () => {
        const breadcrumbs = getBreadcrumbsForRoute(
          getMockObject('alerts', '/alerts', undefined),
          getSecuritySolutionUrl,
          true
        );
        expect(breadcrumbs).toEqual([
          { text: 'Security', href: 'securitySolutionUI/get_started' },
          {
            text: 'Alerts',
            href: '',
          },
        ]);
      });

      test('should return Exceptions breadcrumbs when supplied exceptions pageName', () => {
        const breadcrumbs = getBreadcrumbsForRoute(
          getMockObject('exceptions', '/exceptions', undefined),
          getSecuritySolutionUrl,
          true
        );
        expect(breadcrumbs).toEqual([
          { text: 'Security', href: 'securitySolutionUI/get_started' },
          {
            text: 'Manage',
            href: 'securitySolutionUI/administration',
          },
          {
            text: 'Exception lists',
            href: '',
          },
        ]);
      });

      test('should return Rules breadcrumbs when supplied rules pageName', () => {
        const breadcrumbs = getBreadcrumbsForRoute(
          getMockObject('rules', '/rules', undefined),
          getSecuritySolutionUrl,
          true
        );
        expect(breadcrumbs).toEqual([
          { text: 'Security', href: 'securitySolutionUI/get_started' },
          {
            text: 'Manage',
            href: 'securitySolutionUI/administration',
          },
          {
            text: 'Rules',
            href: '',
          },
        ]);
      });

      test('should return Rules breadcrumbs when supplied rules Creation pageName', () => {
        const breadcrumbs = getBreadcrumbsForRoute(
          getMockObject('rules', '/rules/create', undefined),
          getSecuritySolutionUrl,
          true
        );
        expect(breadcrumbs).toEqual([
          { text: 'Security', href: 'securitySolutionUI/get_started' },
          {
            text: 'Manage',
            href: 'securitySolutionUI/administration',
          },
          {
            text: 'Rules',
            href: 'securitySolutionUI/rules',
          },
          {
            text: 'Create',
            href: '',
          },
        ]);
      });

      test('should return Rules breadcrumbs when supplied rules Details pageName', () => {
        const mockDetailName = '5a4a0460-d822-11eb-8962-bfd4aff0a9b3';
        const mockRuleName = 'ALERT_RULE_NAME';
        const breadcrumbs = getBreadcrumbsForRoute(
          {
            ...getMockObject('rules', `/rules/id/${mockDetailName}`, undefined),
            detailName: mockDetailName,
            state: {
              ruleName: mockRuleName,
            },
          },
          getSecuritySolutionUrl,
          true
        );
        expect(breadcrumbs).toEqual([
          { text: 'Security', href: 'securitySolutionUI/get_started' },
          {
            text: 'Manage',
            href: 'securitySolutionUI/administration',
          },
          {
            text: 'Rules',
            href: 'securitySolutionUI/rules',
          },
          {
            text: mockRuleName,
            href: ``,
          },
        ]);
      });

      test('should return Rules breadcrumbs when supplied rules Edit pageName', () => {
        const mockDetailName = '5a4a0460-d822-11eb-8962-bfd4aff0a9b3';
        const mockRuleName = 'ALERT_RULE_NAME';
        const breadcrumbs = getBreadcrumbsForRoute(
          {
            ...getMockObject('rules', `/rules/id/${mockDetailName}/edit`, undefined),
            detailName: mockDetailName,
            state: {
              ruleName: mockRuleName,
            },
          },
          getSecuritySolutionUrl,
          true
        );
        expect(breadcrumbs).toEqual([
          { text: 'Security', href: 'securitySolutionUI/get_started' },
          {
            text: 'Manage',
            href: 'securitySolutionUI/administration',
          },
          {
            text: 'Rules',
            href: 'securitySolutionUI/rules',
          },
          {
            text: 'ALERT_RULE_NAME',
            href: `securitySolutionUI/rules/id/${mockDetailName}`,
          },
          {
            text: 'Edit',
            href: '',
          },
        ]);
      });

      test('should return null breadcrumbs when supplied Cases pageName', () => {
        const breadcrumbs = getBreadcrumbsForRoute(
          getMockObject('cases', '/', undefined),
          getSecuritySolutionUrl,
          true
        );
        expect(breadcrumbs).toEqual(null);
      });

      test('should return null breadcrumbs when supplied Cases details pageName', () => {
        const sampleCase = {
          id: 'my-case-id',
          name: 'Case name',
        };
        const breadcrumbs = getBreadcrumbsForRoute(
          {
            ...getMockObject('cases', `/${sampleCase.id}`, sampleCase.id),
            state: { caseTitle: sampleCase.name },
          },
          getSecuritySolutionUrl,
          true
        );
        expect(breadcrumbs).toEqual(null);
      });

      test('should return Admin breadcrumbs when supplied endpoints pageName', () => {
        const breadcrumbs = getBreadcrumbsForRoute(
          getMockObject('administration', '/endpoints', undefined),
          getSecuritySolutionUrl,
          true
        );

        expect(breadcrumbs).toEqual([
          { text: 'Security', href: 'securitySolutionUI/get_started' },
          {
            text: 'Manage',
            href: 'securitySolutionUI/administration',
          },
          {
            text: 'Endpoints',
            href: '',
          },
        ]);
      });
    });

    describe('setBreadcrumbs()', () => {
      test('should call chrome breadcrumb service with correct breadcrumbs', () => {
        const navigateToUrlMock = jest.fn();
        const { result } = renderHook(() => useSetBreadcrumbs(), { wrapper: TestProviders });
        result.current(getMockObject('hosts', '/', hostName), chromeMock, navigateToUrlMock);
        const searchString =
          "?sourcerer=()&timerange=(global:(linkTo:!(timeline),timerange:(from:'2019-05-16T23:10:43.696Z',fromStr:now-24h,kind:relative,to:'2019-05-17T23:10:43.697Z',toStr:now)),timeline:(linkTo:!(global),timerange:(from:'2019-05-16T23:10:43.696Z',fromStr:now-24h,kind:relative,to:'2019-05-17T23:10:43.697Z',toStr:now)))";

        expect(setBreadcrumbsMock).toBeCalledWith([
          expect.objectContaining({
            text: 'Security',
            href: `securitySolutionUI/get_started${searchString}`,
            onClick: expect.any(Function),
          }),
          expect.objectContaining({
            text: 'Threat Hunting',
            href: `securitySolutionUI/threat_hunting`,
            onClick: expect.any(Function),
          }),
          expect.objectContaining({
            text: 'Hosts',
            href: `securitySolutionUI/hosts${searchString}`,
            onClick: expect.any(Function),
          }),
          expect.objectContaining({
            text: 'siem-kibana',
            href: `securitySolutionUI/hosts/siem-kibana${searchString}`,
            onClick: expect.any(Function),
          }),
          {
            text: 'Authentications',
            href: '',
          },
        ]);
      });
    });
  });
});
