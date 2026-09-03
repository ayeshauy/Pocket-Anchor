# Auth Testing Playbook (Pocket Anchor)

Uses Emergent-managed Google Auth. Session cookie name: `session_token`.

## Backend endpoints
- POST /api/auth/session  (body: {session_id}) — exchanges Emergent session_id for our session
- GET  /api/auth/me       (cookie or Bearer) — returns current user
- POST /api/auth/logout   — clears cookie + deletes session

## Test setup (mongosh)
```
mongosh --eval "
use('test_database');
var uid='test-user-'+Date.now();
var st='test_session_'+Date.now();
db.users.insertOne({user_id:uid,email:'ayesha.pocketagency@gmail.com',name:'Ayesha',picture:'',sanctuary_name:'Ayesha',sanctuary_slug:'ayesha',created_at:new Date()});
db.user_sessions.insertOne({user_id:uid,session_token:st,expires_at:new Date(Date.now()+7*24*3600*1000),created_at:new Date()});
print('TOKEN:'+st);
"
```

## Verify
```
curl -H "Authorization: Bearer $TOKEN" $URL/api/auth/me
```

## Browser cookie
```
await page.context.add_cookies([{"name":"session_token","value":TOKEN,"domain":"anchor-hope.preview.emergentagent.com","path":"/","httpOnly":True,"secure":True,"sameSite":"None"}])
```
