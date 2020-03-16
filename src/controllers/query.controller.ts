// Uncomment these imports to begin using these cool features!

import {inject} from '@loopback/context';
import {get, param} from '@loopback/rest';
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
    let result: QueryResponse = await this.queryService.getPRs(
      repo,
      'pr',
      'merged',
      startdate,
      enddate,
    );

    let count_maintainers: number = 0;
    let count_community: number = 0;
    let contributorList: Contributor[] = [];

    //TODO need to traverse pagination.

    result.items.forEach(item => {
      if (coreMaintainerList.includes(item.user.login)) {
        count_maintainers++;
      } else {
        count_community++;
      }
      addContribution(contributorList, item.user.login);
    });

    let qr = new QueryResult();
    qr.total_count = result.total_count;
    qr.count_maintainers = count_maintainers;
    qr.count_community = count_community;
    qr.contributions = contributorList;
    return qr;
  }
}
function addContribution(contributors: Contributor[], userId: string): void {
  let found: boolean = false;

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
  contributions: Contributor[];
}

class Contributor {
  userId: string;
  count_contribution: number;
}
