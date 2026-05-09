# アップデート

```
npx -y npm-check-updates -ui
```

# ts直接実行する

```
node --import tsx --env-file .env --watch ./src/scripts/discord.ts
```

# デプロイ

## GitHub Pages (https://thr3a.github.io/<レポジトリ名>の場合)

next.config.mjsより

```ts
const nextConfig = {
  basePath: process.env.GITHUB_ACTIONS && '/レポジトリ名',
  trailingSlash: true,
  // assetPrefix: '/レポジトリ名',
};
```

## GitHub Pages (独自ドメインの場合)

.github/workflows/build.ymlより「cname」をコメントアウト外す

## Kamal

```
dotenv kamal deploy
```

# TODO

- データベース
