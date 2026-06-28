export const SAMPLES = {
  python: {
    name: 'find_user.py',
    language: 'python',
    code: `def find_user(user_id, database):
    for i in range(len(database)):
        if database[i]['id'] == user_id:
            password = database[i]['password']
            query = "SELECT * FROM users WHERE id = " + str(user_id)
            return database[i]
    return None

result = find_user(input("Enter ID: "), users_db)
print(result)`,
  },
  javascript: {
    name: 'api.js',
    language: 'javascript',
    code: `function fetchUserData(userId) {
  var cache = []
  setInterval(function() {
    cache.push(new Array(1000).fill('data'))
  }, 100)
  var query = "SELECT * FROM users WHERE id = " + userId
  eval(localStorage.getItem('userScript'))
  fetch('/api/users/' + userId)
    .then(function(res) { return res.json() })
    .then(function(data) { document.innerHTML = data.bio })
}`,
  },
  java: {
    name: 'UserService.java',
    language: 'java',
    code: `public class UserService {
    public String getUserName(User user) {
        return user.getProfile().getName().toUpperCase();
    }
    public List findAllUsers() {
        List results = new ArrayList();
        for (int i = 0; i < database.size(); i++) {
            results.add(database.get(i));
        }
        return results;
    }
    public void deleteUser(String id) {
        String sql = "DELETE FROM users WHERE id = '" + id + "'";
        db.execute(sql);
    }
}`,
  },
};
