/**
 * @jest-environment jsdom
 */

// eslint-disable-next-line no-warning-comments
// TODO: should not be required, or should be centralized
import '@quilted/quilt/matchers';

import {Link as RouterLink} from '@quilted/quilt';
import {mount} from '@quilted/quilt/testing';
import {Link} from './Link';

jest.mock('@quilted/quilt', () => ({
  Link: () => null,
}));

describe('<Link />', () => {
  it('renders a Quilt link', () => {
    const to = '/some/path';
    const link = mount(<Link to={to} />);
    expect(link).toContainReactComponent(RouterLink, {to});
  });
});
