import reject from 'lodash/reject'

const newDefaultUser = {
  name: '',
  password: '',
  roles: [],
  permissions: [],
  links: {self: ''},
  isNew: true,
}

const newDefaultRole = {
  name: '',
  permissions: [],
  users: [],
  links: {self: ''},
  isNew: true,
}

const newDefaultRP = {
  id: '',
  name: 'autogen',
  duration: '0',
  replication: 2,
  isDefault: true,
}

const newEmptyRP = {
  name: '',
  duration: '',
  replication: 0,
  isNew: true,
}

const newDefaultDatabase = {
  name: '',
  isNew: true,
  retentionPolicies: [newDefaultRP],
}

const initialState = {
  users: null,
  roles: [],
  permissions: [],
  queries: [],
  queryIDToKill: null,
  databases: [],
}

export default function admin(state = initialState, action) {
  switch (action.type) {
    case 'LOAD_USERS': {
      return {...state, ...action.payload}
    }

    case 'LOAD_ROLES': {
      return {...state, ...action.payload}
    }

    case 'LOAD_PERMISSIONS': {
      return {...state, ...action.payload}
    }

    case 'LOAD_DATABASES': {
      return {...state, ...action.payload}
    }

    case 'ADD_USER': {
      const newUser = {...newDefaultUser, isEditing: true}
      return {
        ...state,
        users: [
          newUser,
          ...state.users,
        ],
      }
    }

    case 'ADD_ROLE': {
      const newRole = {...newDefaultRole, isEditing: true}
      return {
        ...state,
        roles: [
          newRole,
          ...state.roles,
        ],
      }
    }

    case 'ADD_DATABASE': {
      const {id} = action.payload
      const newDatabase = {...newDefaultDatabase, id, isEditing: true}

      return {
        ...state,
        databases: [
          newDatabase,
          ...state.databases,
        ],
      }
    }

    case 'ADD_RETENTION_POLICY': {
      const {database, id} = action.payload
      const databases = state.databases.map(db =>
        db.id === database.id ?
        {...database, retentionPolicies: [{...newEmptyRP, id}, ...database.retentionPolicies]}
        : db
      )

      return {...state, databases}
    }

    case 'SYNC_USER': {
      const {staleUser, syncedUser} = action.payload
      const newState = {
        users: state.users.map(u => u.links.self === staleUser.links.self ? {...syncedUser} : u),
      }
      return {...state, ...newState}
    }

    case 'SYNC_ROLE': {
      const {staleRole, syncedRole} = action.payload
      const newState = {
        roles: state.roles.map(r => r.links.self === staleRole.links.self ? {...syncedRole} : r),
      }
      return {...state, ...newState}
    }

    case 'SYNC_DATABASE': {
      const {stale, synced} = action.payload
      const newState = {
        databases: state.databases.map(db => db.id === stale.id ? {...synced} : db),
      }
      return {...state, ...newState}
    }

    case 'EDIT_USER': {
      const {user, updates} = action.payload
      const newState = {
        users: state.users.map(u => u.links.self === user.links.self ? {...u, ...updates} : u),
      }
      return {...state, ...newState}
    }

    case 'EDIT_ROLE': {
      const {role, updates} = action.payload
      const newState = {
        roles: state.roles.map(r => r.links.self === role.links.self ? {...r, ...updates} : r),
      }
      return {...state, ...newState}
    }

    case 'EDIT_DATABASE': {
      const {database, name} = action.payload
      const newState = {
        databases: state.databases.map(db => db.id === database.id ? {...db, name} : db),
      }

      return {...state, ...newState}
    }

    case 'EDIT_RETENTION_POLICY': {
      const {database, retentionPolicy} = action.payload

      const newState = {
        databases: state.databases.map(db => db.id === database.id ? {
          ...db,
          retentionPolicies: db.retentionPolicies.map(rp => rp.id === retentionPolicy.id ? {...rp, ...retentionPolicy} : rp),
        } : db),
      }

      return {...state, ...newState}
    }

    case 'DELETE_USER': {
      const {user} = action.payload
      const newState = {
        users: state.users.filter(u => u.links.self !== user.links.self),
      }

      return {...state, ...newState}
    }

    case 'DELETE_ROLE': {
      const {role} = action.payload
      const newState = {
        roles: state.roles.filter(r => r.links.self !== role.links.self),
      }

      return {...state, ...newState}
    }

    case 'REMOVE_DATABASE': {
      const {database} = action.payload
      const newState = {
        databases: state.databases.filter(db => db.id !== database.id),
      }

      return {...state, ...newState}
    }

    case 'REMOVE_RETENTION_POLICY': {
      const {database, retentionPolicy} = action.payload
      const newState = {
        databases: state.databases.map(db => db.id === database.id ? {
          ...db,
          retentionPolicies: db.retentionPolicies.filter(rp => rp.id !== retentionPolicy.id),
        }
          : db),
      }

      return {...state, ...newState}
    }

    case 'START_DELETE_DATABASE': {
      const {database} = action.payload
      const newState = {
        databases: state.databases.map(db => db.id === database.id ? {...db, deleteCode: ''} : db),
      }

      return {...state, ...newState}
    }

    case 'UPDATE_DATABASE_DELETE_CODE': {
      const {database, deleteCode} = action.payload
      const newState = {
        databases: state.databases.map(db => db.id === database.id ? {...db, deleteCode} : db),
      }

      return {...state, ...newState}
    }

    case 'REMOVE_DATABASE_DELETE_CODE': {
      const {database} = action.payload
      delete database.deleteCode

      const newState = {
        databases: state.databases.map(db => db.id === database.id ? {...database} : db),
      }

      return {...state, ...newState}
    }

    case 'LOAD_QUERIES': {
      return {...state, ...action.payload}
    }

    case 'FILTER_USERS': {
      const {text} = action.payload
      const newState = {
        users: state.users.map(u => {
          u.hidden = !u.name.toLowerCase().includes(text)
          return u
        }),
      }
      return {...state, ...newState}
    }

    case 'FILTER_ROLES': {
      const {text} = action.payload
      const newState = {
        roles: state.roles.map(r => {
          r.hidden = !r.name.toLowerCase().includes(text)
          return r
        }),
      }
      return {...state, ...newState}
    }

    case 'KILL_QUERY': {
      const {queryID} = action.payload
      const nextState = {
        queries: reject(state.queries, (q) => +q.id === +queryID),
      }

      return {...state, ...nextState}
    }

    case 'SET_QUERY_TO_KILL': {
      return {...state, ...action.payload}
    }
  }

  return state
}
