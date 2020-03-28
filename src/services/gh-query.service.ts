import {inject, Provider} from '@loopback/core';
import {getService} from '@loopback/service-proxy';
import {GithubdsDataSource} from '../datasources';

export interface GhQueryService {
  // this is where you define the Node.js methods that will be
  // mapped to REST/SOAP/gRPC operations as stated in the datasource
  // json file.

  // References: https://help.github.com/en/articles/searching-issues-and-pull-requests#search-within-a-users-or-organizations-repositories
  // repo: for example, strongloop/loopback-next
  // type: pr | issue
  // action: merged | closed | created
  // startdate, enddate: in the format of yyyy-mm-dd
  getPRs(
    repo: string,
    type: string,
    action: string,
    startdate: string,
    enddate: string,
  ): Promise<QueryResponse>;

  getResults(url: string): Promise<QueryResponse>;
}

export interface QueryResponse {
  total_count: number;
  items: PRInfo[];
}
export class PRInfo {
  url: string;
  state: string;
  user: GitHubUser;
  number: number;
  created_at: string;
  author_association: string;
}
export class GitHubUser {
  login: string;
  url: string;
  avatar_url: string;
}

export class GhQueryProvider implements Provider<GhQueryService> {
  constructor(
    // githubds must match the name property in the datasource json file
    @inject('datasources.githubds')
    protected dataSource: GithubdsDataSource = new GithubdsDataSource(),
  ) {}

  value(): Promise<GhQueryService> {
    return getService(this.dataSource);
  }
}
