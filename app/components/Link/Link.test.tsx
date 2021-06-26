/**
 * @jest-environment jsdom
 */

// TODO: should not be required, or should be centralized
import '@quilted/quilt/matchers';

import {Link as RouterLink} from '@quilted/quilt';
import {mount} from '@quilted/quilt/testing';
import {Link} from './Link';

describe('<Link />', () => {
  it('renders a Quilt link', () => {
    const to = '/some/path';
    const link = mount(<Link to={to} />);
    expect(link).toContainReactComponent(RouterLink, {to});
  });
});
