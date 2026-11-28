import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { TextInactivityNotice } from '../TextInactivityNotice';

describe('text interview inactivity notice', () => {
  it('shows no interruption during active drafting', () => {
    expect(renderToStaticMarkup(<TextInactivityNotice phase="active" onContinue={() => undefined} />)).toBe('');
  });
  it('warns inline without trapping focus before pausing', () => {
    const html = renderToStaticMarkup(<TextInactivityNotice phase="warning" onContinue={() => undefined} />);
    expect(html).toContain('role="status"');
    expect(html).toContain('Tiếp tục soạn');
    expect(html).not.toContain('role="dialog"');
  });
  it('explains draft retention and the existing session time limit in an accessible modal', () => {
    const html = renderToStaticMarkup(<TextInactivityNotice phase="paused" onContinue={() => undefined} />);
    expect(html).toContain('role="dialog"');
    expect(html).toContain('aria-modal="true"');
    expect(html).toContain('Nội dung đang soạn vẫn được giữ nguyên');
    expect(html).toContain('Thời hạn của buổi phỏng vấn vẫn tiếp tục được tính');
    expect(html).toContain('Tiếp tục soạn');
  });
});
