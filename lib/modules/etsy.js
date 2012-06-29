var oauthModule = require('./oauth');

var etsy = module.exports =
oauthModule.submodule('etsy')
  .configurable({
      scope: "Permission scopes your application will need to access (see list at http://www.etsy.com/developers/documentation/getting_started/oauth), separated by spaces."
  })
  .apiHost('http://openapi.etsy.com/v2')
  .oauthHost('http://openapi.etsy.com/v2')

  .entryPath('/auth/etsy')
  .callbackPath('/auth/etsy/callback')

  .requestTokenPath('/oauth/request_token')
  .accessTokenPath('/oauth/access_token')

  .requestTokenQueryParam('scope', function () {
    return this._scope && this.scope();
  })

  .redirectToProviderAuth( function (res, token) {
    this.redirect(res, this.apiHost() + token["login_url"] )
  })

  .fetchOAuthUser( function (accessToken, accessTokenSecret, params) {
    var p = this.Promise();
    this.oauth.get(this.apiHost() + '/users/__SELF__', accessToken, accessTokenSecret, function (err, data) {
      if (err) return p.fail(err);
      var oauthUser = JSON.parse(data);
      oauthUser.id = oauthUser.uid;
      p.fulfill(oauthUser);
    });
  })
  .moduleErrback( function (err, seqValues) {
    if (err instanceof Error) {
      var next = seqValues.next;
      return next(err);
    } else if (err.extra) {
      var res = err.extra.res
        , serverResponse = seqValues.res;
      serverResponse.writeHead(
          res.statusCode
        , res.headers);
      serverResponse.end(err.extra.data);
    } else if (err.statusCode) {
      var serverResponse = seqValues.res;
      serverResponse.writeHead(err.statusCode);
      serverResponse.end(err.data);
    } else {
      console.error(err);
      throw new Error('Unsupported error type');
    }
  });
