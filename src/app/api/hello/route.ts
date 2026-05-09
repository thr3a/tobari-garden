import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// リクエストのバリデーションスキーマ定義
// Zodを使用して型安全なバリデーションを行う
const requestSchema = z.object({
  name: z.string().min(1) // nameは必須の文字列
});

/**
 * GETメソッドのハンドラー
 * クエリパラメータからnameを受け取り、バリデーションを行う
 *
 * @param req - NextRequestオブジェクト。リクエスト情報を含む
 * @returns NextResponse - JSON形式のレスポンス
 *
 * 使用例: GET /api/hello?name=John
 */
export const GET = (req: NextRequest): NextResponse => {
  // クエリパラメータをオブジェクトに変換
  // req.nextUrl.searchParams.entries()でURLSearchParamsのイテレータを取得
  const params = Object.fromEntries(req.nextUrl.searchParams.entries());

  // safeParseでバリデーション実行
  // 成功時は { success: true, data: T }、失敗時は { success: false, error: ZodError }
  const result = requestSchema.safeParse(params);

  // バリデーション失敗時のエラーレスポンス
  if (!result.success) {
    const { issues } = result.error;
    return NextResponse.json(
      {
        status: 'ng',
        errors: issues // Zodのバリデーションエラー詳細
      },
      { status: 400 } // HTTP 400 Bad Request
    );
  }

  // バリデーション成功時の正常レスポンス
  return NextResponse.json({
    status: 'ok',
    result: result.data // バリデーション済みのデータ（型推論が効く）
  });
};

/**
 * POSTメソッドのハンドラー
 * リクエストボディからnameを受け取り、バリデーションを行う
 *
 * @param req - NextRequestオブジェクト。リクエスト情報を含む
 * @returns Promise<NextResponse> - JSON形式のレスポンス
 *
 * 使用例: POST /api/hello -H "Content-Type: application/json" -d '{"name":"John"}'
 */
export const POST = async (req: NextRequest): Promise<NextResponse> => {
  // リクエストボディをJSONとしてパース
  const body = await req.json();

  // safeParseでバリデーション実行
  const result = requestSchema.safeParse(body);

  // バリデーション失敗時のエラーレスポンス
  if (!result.success) {
    const { issues } = result.error;
    return NextResponse.json(
      {
        status: 'ng',
        errorMessage: 'Validation error',
        errors: issues // Zodのバリデーションエラー詳細
      },
      { status: 400 } // HTTP 400 Bad Request
    );
  }

  // バリデーション成功時の正常レスポンス
  return NextResponse.json({
    status: 'ok',
    result: result.data // バリデーション済みのデータ（型推論が効く）
  });
};
