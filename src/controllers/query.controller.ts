// Uncomment these imports to begin using these cool features!

import {Context, inject} from '@loopback/context';
import {invokeMethod} from '@loopback/core';
import {get, param} from '@loopback/rest';
import {IncomingMessage} from 'http';
import {GhQueryService, QueryResponse} from '../services';

const coreMaintainerList: string[] = [
  'raymondfeng',
  'bajtos',
  'dhmlau',
  'jannyhou',
  'emonddr',
  'nabdelgadir',
  'hacksparrow',
  'agnes512',
  'deepakrkris',
];

const communityMaintainerList: string[] = [
  'achrinza',
  'dougal83',
  'derdeka',
  'marioestradarosa',
  'yaty',
  'frbuceta',
  'mschnee',
];

// github id we want to ignore here
const renovateBot: string = 'app/renovate';

export class QueryController {
  // inject the query service
  constructor(
    @inject('services.GhQuery') protected queryService: GhQueryService,
  ) {}

  /**
   * Get all merged PRs
   * @param startdate
   * @param enddate
   */
  @get('/pr/{repo}/{startdate}/{enddate}')
  async getAllMergedPRs(
    @param.path.string('repo') repo: string,
    @param.path.string('startdate') startdate: string,
    @param.path.string('enddate') enddate: string,
  ): Promise<QueryResult> {
    // let result: QueryResponse = await this.queryService.getPRs(
    //   repo,
    //   'pr',
    //   'merged',
    //   startdate,
    //   enddate,
    // );

    // let count_maintainers: number = 0;
    // let count_community: number = 0;
    // let contributorList: Contributor[] = [];

    //Reference:
    // pagination for github APIs: https://developer.github.com/v3/guides/traversing-with-pagination/#navigating-through-the-pages
    // get headers: https://github.com/strongloop/loopback-connector-rest/issues/131
    let qr = new QueryResult();
    qr.contributorList = [];
    await invokeMethod(this.queryService, 'getPRs', new Context(), [
      repo,
      'pr',
      'merged',
      startdate,
      enddate,
      function(err: object, result: object, response: IncomingMessage) {
        qr.total_count = (result as QueryResponse).total_count;

        (result as QueryResponse).items.forEach(item => {
          if (coreMaintainerList.includes(item.user.login)) {
            console.log('add.. ', item.user.login);
            qr.count_maintainers++;
          } else {
            qr.count_community++;
          }
          addContribution(qr.contributorList, item.user.login);
        });

        // check if the results are in multiple pages
        console.log(response.headers.link);
        if (response.headers.link) {
          const link: string = response.headers.link as string;
          const nextLink = getNextLink(link.slice(0, link.indexOf(',')));
          qr.nextLink = nextLink;
          console.log('next link = ', nextLink);
        }
      },
    ]);
    await getMoreResults(qr.nextLink, this.queryService, qr);
    // while (qr.nextLink) {
    //   console.log('!@#$$#$#@#$$#@');
    //   await invokeMethod(this.queryService, 'getResults', new Context(), [
    //     qr.nextLink,
    //     function(err: object, result: object, response: IncomingMessage) {
    //       (result as QueryResponse).items.forEach(item => {
    //         if (coreMaintainerList.includes(item.user.login)) {
    //           count_maintainers++;
    //         } else {
    //           count_community++;
    //         }
    //         addContribution(contributorList, item.user.login);
    //       });

    //       // check if the results are in multiple pages
    //       console.log(response.headers.link);
    //       if (response.headers.link) {
    //         const link: string = response.headers.link as string;
    //         const nextLink = getNextLink(link.slice(0, link.indexOf(',')));
    //         qr.nextLink = nextLink;
    //         console.log('inside ... next link = ', nextLink);
    //       }
    //     },
    //   ]);
    // }
    // console.log('returning...count_maintainers=', count_maintainers);
    // qr.count_maintainers = count_maintainers;
    // qr.count_community = count_community;
    // qr.contributorList = contributorList;
    return qr;
  }
}

async function getMoreResults(
  nextLink: string,
  queryService: GhQueryService,
  qr: QueryResult,
): Promise<QueryResult> {
  while (qr.nextLink) {
    console.log('!@#$$#$#@#$$#@');
    await invokeMethod(queryService, 'getResults', new Context(), [
      qr.nextLink,
      function(err: object, result: object, response: IncomingMessage) {
        (result as QueryResponse).items.forEach(item => {
          if (coreMaintainerList.includes(item.user.login)) {
            qr.count_maintainers++;
          } else {
            qr.count_community++;
          }
          addContribution(qr.contributorList, item.user.login);
        });

        // check if the results are in multiple pages
        console.log(response.headers.link);
        if (response.headers.link) {
          const link: string = response.headers.link as string;
          const nextLink = getNextLink(link.slice(0, link.indexOf(',')));
          qr.nextLink = nextLink;
          console.log('inside ... next link = ', nextLink);
        }
      },
    ]);
  }
  return qr;
}

function getNextLink(link: string): string {
  const nextPart: string = link.slice(0, link.indexOf(','));
  const nextLink = nextPart.slice(1, nextPart.indexOf('>'));
  return nextLink;
}
function addContribution(contributors: Contributor[], userId: string): void {
  let found: boolean = false;
  console.log('contributors=', contributors);
  for (let contributor of contributors) {
    if (contributor.userId === userId) {
      contributor.count_contribution++;
      found = true;
      break;
    }
  }
  if (!found) {
    let c: Contributor = new Contributor();
    c.userId = userId;
    c.count_contribution = 1;
    contributors.push(c);
  }
}

class QueryResult {
  total_count: number;
  count_community: number;
  count_maintainers: number;
  contributorList: Contributor[];
  nextLink: string;
}

class Contributor {
  userId: string;
  count_contribution: number;
}
