/**
 * 有理数クラス
 * 分数形式で数値を正確に表現し、四則演算を行う
 */
class Rational {
  private numerator: number;   // 分子
  private denominator: number; // 分母

  constructor(numerator: number, denominator: number = 1) {
    if (denominator === 0) {
      throw new Error('分母が0になることはできません');
    }
    
    // 符号を分子に統一
    if (denominator < 0) {
      numerator = -numerator;
      denominator = -denominator;
    }
    
    // 既約分数にする
    const gcd = this.gcd(Math.abs(numerator), Math.abs(denominator));
    this.numerator = numerator / gcd;
    this.denominator = denominator / gcd;
  }

  /**
   * 最大公約数を求める（ユークリッドの互除法）
   */
  private gcd(a: number, b: number): number {
    while (b !== 0) {
      const temp = b;
      b = a % b;
      a = temp;
    }
    return a;
  }

  /**
   * 数値から有理数を作成
   */
  static fromNumber(num: number): Rational {
    if (num === Math.floor(num)) {
      return new Rational(num, 1);
    }
    
    // 小数を分数に変換
    const str = num.toString();
    const decimalIndex = str.indexOf('.');
    if (decimalIndex === -1) {
      return new Rational(num, 1);
    }
    
    const decimalPlaces = str.length - decimalIndex - 1;
    const denominator = Math.pow(10, decimalPlaces);
    const numerator = num * denominator;
    
    return new Rational(numerator, denominator);
  }

  /**
   * 加算
   */
  add(other: Rational): Rational {
    const num = this.numerator * other.denominator + other.numerator * this.denominator;
    const den = this.denominator * other.denominator;
    return new Rational(num, den);
  }

  /**
   * 減算
   */
  subtract(other: Rational): Rational {
    const num = this.numerator * other.denominator - other.numerator * this.denominator;
    const den = this.denominator * other.denominator;
    return new Rational(num, den);
  }

  /**
   * 乗算
   */
  multiply(other: Rational): Rational {
    return new Rational(
      this.numerator * other.numerator,
      this.denominator * other.denominator
    );
  }

  /**
   * 除算
   */
  divide(other: Rational): Rational {
    if (other.numerator === 0) {
      throw new Error('0で割ることはできません');
    }
    return new Rational(
      this.numerator * other.denominator,
      this.denominator * other.numerator
    );
  }

  /**
   * 数値に変換
   */
  toNumber(): number {
    return this.numerator / this.denominator;
  }

  /**
   * 文字列表現
   */
  toString(): string {
    if (this.denominator === 1) {
      return this.numerator.toString();
    }
    return `${this.numerator}/${this.denominator}`;
  }

  /**
   * 等値判定
   */
  equals(other: Rational): boolean {
    return this.numerator === other.numerator && this.denominator === other.denominator;
  }

  /**
   * 整数かどうかを判定
   */
  isInteger(): boolean {
    return this.denominator === 1;
  }
}

/**
 * トークンの種類
 */
enum TokenType {
  NUMBER = 'NUMBER',
  PLUS = 'PLUS',
  MINUS = 'MINUS',
  MULTIPLY = 'MULTIPLY',
  DIVIDE = 'DIVIDE',
  LEFT_PAREN = 'LEFT_PAREN',
  RIGHT_PAREN = 'RIGHT_PAREN',
  EOF = 'EOF'
}

/**
 * トークン
 */
interface Token {
  type: TokenType;
  value: string;
}

/**
 * 字句解析器（レキサー）
 */
class Lexer {
  private input: string;
  private position: number = 0;
  private currentChar: string | null = null;

  constructor(input: string) {
    this.input = input.replace(/\s+/g, ''); // 空白を除去
    this.currentChar = this.input[this.position] || null;
  }

  /**
   * 現在位置を進める
   */
  private advance(): void {
    this.position++;
    this.currentChar = this.position < this.input.length ? this.input[this.position] : null;
  }

  /**
   * 数値を読み取る
   */
  private readNumber(): string {
    let result = '';
    while (this.currentChar !== null && /[\d.]/.test(this.currentChar)) {
      result += this.currentChar;
      this.advance();
    }
    return result;
  }

  /**
   * 次のトークンを取得
   */
  getNextToken(): Token {
    while (this.currentChar !== null) {
      if (/\d/.test(this.currentChar)) {
        return {
          type: TokenType.NUMBER,
          value: this.readNumber()
        };
      }

      switch (this.currentChar) {
        case '+':
          this.advance();
          return { type: TokenType.PLUS, value: '+' };
        case '-':
          this.advance();
          return { type: TokenType.MINUS, value: '-' };
        case '*':
        case '×':
          this.advance();
          return { type: TokenType.MULTIPLY, value: '*' };
        case '/':
        case '÷':
          this.advance();
          return { type: TokenType.DIVIDE, value: '/' };
        case '(':
          this.advance();
          return { type: TokenType.LEFT_PAREN, value: '(' };
        case ')':
          this.advance();
          return { type: TokenType.RIGHT_PAREN, value: ')' };
        default:
          throw new Error(`不正な文字: ${this.currentChar}`);
      }
    }

    return { type: TokenType.EOF, value: '' };
  }
}

/**
 * 構文解析器（パーサー）
 * 再帰下降構文解析を使用
 */
class Parser {
  private lexer: Lexer;
  private currentToken: Token;

  constructor(lexer: Lexer) {
    this.lexer = lexer;
    this.currentToken = this.lexer.getNextToken();
  }

  /**
   * 指定されたトークンタイプを消費
   */
  private eat(tokenType: TokenType): void {
    if (this.currentToken.type === tokenType) {
      this.currentToken = this.lexer.getNextToken();
    } else {
      throw new Error(`期待されるトークン: ${tokenType}, 実際: ${this.currentToken.type}`);
    }
  }

  /**
   * 因子の解析: 数値または括弧で囲まれた式
   * factor: NUMBER | LEFT_PAREN expr RIGHT_PAREN
   */
  private factor(): Rational {
    const token = this.currentToken;

    if (token.type === TokenType.PLUS) {
      this.eat(TokenType.PLUS);
      return this.factor();
    } else if (token.type === TokenType.MINUS) {
      this.eat(TokenType.MINUS);
      return Rational.fromNumber(0).subtract(this.factor());
    } else if (token.type === TokenType.NUMBER) {
      this.eat(TokenType.NUMBER);
      return Rational.fromNumber(parseFloat(token.value));
    } else if (token.type === TokenType.LEFT_PAREN) {
      this.eat(TokenType.LEFT_PAREN);
      const result = this.expr();
      this.eat(TokenType.RIGHT_PAREN);
      return result;
    }

    throw new Error(`予期しないトークン: ${token.type}`);
  }

  /**
   * 項の解析: 乗算と除算
   * term: factor ((MULTIPLY | DIVIDE) factor)*
   */
  private term(): Rational {
    let result = this.factor();

    while ([TokenType.MULTIPLY, TokenType.DIVIDE].includes(this.currentToken.type)) {
      const token = this.currentToken;
      
      if (token.type === TokenType.MULTIPLY) {
        this.eat(TokenType.MULTIPLY);
        result = result.multiply(this.factor());
      } else if (token.type === TokenType.DIVIDE) {
        this.eat(TokenType.DIVIDE);
        result = result.divide(this.factor());
      }
    }

    return result;
  }

  /**
   * 式の解析: 加算と減算
   * expr: term ((PLUS | MINUS) term)*
   */
  private expr(): Rational {
    let result = this.term();

    while ([TokenType.PLUS, TokenType.MINUS].includes(this.currentToken.type)) {
      const token = this.currentToken;
      
      if (token.type === TokenType.PLUS) {
        this.eat(TokenType.PLUS);
        result = result.add(this.term());
      } else if (token.type === TokenType.MINUS) {
        this.eat(TokenType.MINUS);
        result = result.subtract(this.term());
      }
    }

    return result;
  }

  /**
   * パース実行
   */
  parse(): Rational {
    const result = this.expr();
    
    if (this.currentToken.type !== TokenType.EOF) {
      throw new Error('不正な式です');
    }
    
    return result;
  }
}

/**
 * 四則演算パーサーのメインクラス
 */
export class ArithmeticParser {
  /**
   * 数式を評価して結果を返す
   * @param expression 数式文字列
   * @returns 計算結果（Rational型）
   */
  static evaluate(expression: string): Rational {
    try {
      const lexer = new Lexer(expression);
      const parser = new Parser(lexer);
      return parser.parse();
    } catch (error) {
      throw new Error(`計算エラー: ${error instanceof Error ? error.message : '不明なエラー'}`);
    }
  }

  /**
   * 数式を評価して数値として返す
   * @param expression 数式文字列
   * @returns 計算結果（数値）
   */
  static evaluateToNumber(expression: string): number {
    return this.evaluate(expression).toNumber();
  }

  /**
   * 式が有効かどうかをチェック
   * @param expression 数式文字列
   * @returns 有効な式かどうか
   */
  static isValidExpression(expression: string): boolean {
    try {
      this.evaluate(expression);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 10パズル用：指定した数字のみを使用しているかチェック
   * @param expression 数式文字列
   * @param allowedNumbers 使用可能な数字の配列
   * @returns 指定した数字のみを使用しているか
   */
  static validateNumbersUsage(expression: string, allowedNumbers: number[]): boolean {
    // 数字のみを抽出
    const numbersInExpression = expression
      .replace(/[+\-*/÷×()\s]/g, '')
      .split('')
      .filter(char => /\d/.test(char))
      .map(Number);

    // 使用した数字をカウント
    const usedCount: { [key: number]: number } = {};
    numbersInExpression.forEach(num => {
      usedCount[num] = (usedCount[num] || 0) + 1;
    });

    // 許可された数字をカウント
    const allowedCount: { [key: number]: number } = {};
    allowedNumbers.forEach(num => {
      allowedCount[num] = (allowedCount[num] || 0) + 1;
    });

    // 使用した数字が許可された数字の範囲内かチェック
    for (const [num, count] of Object.entries(usedCount)) {
      const numKey = parseInt(num);
      if (!allowedCount[numKey] || count > allowedCount[numKey]) {
        return false;
      }
    }

    return true;
  }
}

// 使用例とテスト
export function runTests(): void {
  console.log('=== 四則演算パーサーのテスト ===');
  
  const testCases = [
    '2 + 3 * 4',           // 14
    '(2 + 3) * 4',         // 20
    '10 / 2 + 3',          // 8
    '1 + 2 * 3 - 4',       // 3
    '(7 + 3) / 2',         // 5
    '8 - 3 + 2',           // 7
    '2 * 3 + 4 * 5',       // 26
    '(1 + 2) * (3 + 4)',   // 21
    '7 × 8 ÷ 2',           // 28（×、÷記号対応）
    '3.5 + 2.25',          // 5.75（小数対応）
  ];

  testCases.forEach(expression => {
    try {
      const result = ArithmeticParser.evaluateToNumber(expression);
      console.log(`${expression} = ${result}`);
    } catch (error) {
      console.error(`エラー: ${expression} - ${error}`);
    }
  });

  // 10パズルのテスト
  console.log('\n=== 10パズルのテスト ===');
  const puzzleNumbers = [3, 7, 8, 9];
  const puzzleExpressions = [
    '(7 + 3) * 8 / 9',     // 約8.89（10ではない）
    '7 + 8 - 9 + 3',       // 9（10ではない）
    '(9 - 7) * (8 - 3)',   // 10（正解！）
    '8 + 9 - 7 * 3',       // 使用数字エラー
  ];

  puzzleExpressions.forEach(expression => {
    try {
      const result = ArithmeticParser.evaluateToNumber(expression);
      const isValidNumbers = ArithmeticParser.validateNumbersUsage(expression, puzzleNumbers);
      const isCorrect = Math.abs(result - 10) < 1e-10;
      
      console.log(`${expression} = ${result}`);
      console.log(`  数字チェック: ${isValidNumbers ? 'OK' : 'NG'}`);
      console.log(`  10パズル: ${isCorrect ? '正解！' : '不正解'}`);
      console.log('---');
    } catch (error) {
      console.error(`エラー: ${expression} - ${error}`);
    }
  });
}

// エクスポート
export { Rational };