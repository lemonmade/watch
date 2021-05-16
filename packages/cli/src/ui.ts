/* eslint-disable no-console */

import stripAnsi from 'strip-ansi';
import ansiEscapes from 'ansi-escapes';

import * as Style from 'colorette';

interface StyleProp {
  (content: string, style: typeof Style): string;
}

export interface Ui {
  readonly isInteractive: boolean;
  Heading(content: string, props?: {style?: StyleProp}): void;
  TextBlock(
    content: string,
    props?: {spacing?: boolean; style?: StyleProp},
  ): void;
  Link(url: string): string;
  Code(content: string): string;
  List(content: (List: {Item(content: string): void}) => void): void;
}

const HEADING_SEPARATOR_CHARACTER = '\u2015';
const HEADING_LEADING_SEPARATOR_CHARACTERS = 3;
const HEADING_TRAILING_SEPARATOR_SPACING = 5;

export class PrintableError {
  private readonly original?: Pick<Error, 'message' | 'stack'>;

  constructor(
    private readonly printMessage: string | ((ui: Ui) => string),
    {original}: {original?: Pick<Error, 'message' | 'stack'>} = {},
  ) {
    this.original = original;
  }

  print(ui: Ui) {
    const {printMessage} = this;

    ui.Heading('error!', {
      style: (content, style) => style.red(content),
    });

    ui.TextBlock(
      typeof printMessage === 'string' ? printMessage : printMessage(ui),
    );

    if (this.original) {
      console.log(this.original.message);

      if (this.original.stack) {
        console.log(
          Style.dim(
            this.original.stack
              .replace(this.original.message, '')
              .replace(/^\s/, ''),
          ),
        );
      }
    }
  }
}

export function createUi(): Ui {
  const isInteractive = process.stdin.isTTY;

  return {
    isInteractive,
    Heading(content, {style} = {}) {
      newline();

      const contentWithSeparator = `${HEADING_SEPARATOR_CHARACTER.repeat(
        HEADING_LEADING_SEPARATOR_CHARACTERS,
      )} ${content} ${'\u2015'.repeat(
        Math.max(
          0,
          (process.stdout.columns ?? 25) -
            stripAnsi(content).length -
            HEADING_LEADING_SEPARATOR_CHARACTERS -
            HEADING_TRAILING_SEPARATOR_SPACING -
            2,
        ),
      )}`;

      console.log(
        Style.bold(
          style?.(contentWithSeparator, Style) ?? contentWithSeparator,
        ),
      );
    },
    TextBlock(content, {style, spacing = true} = {}) {
      if (spacing) newline();
      console.log(prettyFormat(style ? style(content, Style) : content));
    },
    Code(content) {
      return Style.bold(content);
    },
    Link(url) {
      const wrappedUrl =
        !Style.options.enabled || process.env.CI || !process.stdout.isTTY
          ? url
          : ansiEscapes.link(url, url);

      return Style.underline(Style.magenta(wrappedUrl));
    },
    List(content) {
      newline();

      content({
        Item(content) {
          console.log(`  * ${prettyFormat(content, {indent: 4})}`);
        },
      });
    },
  };

  function newline() {
    console.log();
  }
}

function prettyFormat(content: string, {indent = 0} = {}) {
  if (process.env.CI) return content;

  const columns = process.stdout.columns ?? 60;

  return content
    .split('\n')
    .map((paragraph) => {
      let buffer = '';
      let currentColumn = 0;
      let needsSpace = false;

      const words = paragraph.split(' ');

      for (const word of words) {
        const length = stripAnsi(word).length;

        const newColumnOnSameLine =
          currentColumn + length + (needsSpace ? 1 : 0);

        if (currentColumn >= 0.5 * columns && columns < newColumnOnSameLine) {
          buffer += `\n${' '.repeat(indent)}${word}`;
          currentColumn = (indent + length) % columns;
        } else {
          if (needsSpace) buffer += ' ';
          buffer += word;
          currentColumn = newColumnOnSameLine % columns;
        }

        if (currentColumn === 0) {
          buffer += `\n${' '.repeat(indent)}`;
          currentColumn = indent;
          needsSpace = false;
        } else {
          needsSpace = true;
        }
      }

      return buffer;
    })
    .join('\n');
}
