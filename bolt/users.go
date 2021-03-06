package bolt

import (
	"context"

	"github.com/boltdb/bolt"
	"github.com/influxdata/chronograf"
	"github.com/influxdata/chronograf/bolt/internal"
)

// Ensure UsersStore implements chronograf.UsersStore.
var _ chronograf.UsersStore = &UsersStore{}

// UsersBucket is used to store users local to chronograf
var UsersBucket = []byte("UsersV1")

// UsersStore uses bolt to store and retrieve users
type UsersStore struct {
	client *Client
}

// get searches the UsersStore for user with name and returns the bolt representation
func (s *UsersStore) get(ctx context.Context, name string) (*internal.User, error) {
	found := false
	var user internal.User
	err := s.client.db.View(func(tx *bolt.Tx) error {
		err := tx.Bucket(UsersBucket).ForEach(func(k, v []byte) error {
			var u chronograf.User
			if err := internal.UnmarshalUser(v, &u); err != nil {
				return err
			} else if u.Name != name {
				return nil
			}
			found = true
			if err := internal.UnmarshalUserPB(v, &user); err != nil {
				return err
			}
			return nil
		})
		if err != nil {
			return err
		}
		if found == false {
			return chronograf.ErrUserNotFound
		}
		return nil
	})
	if err != nil {
		return nil, err
	}

	return &user, nil
}

// Get searches the UsersStore for user with name
func (s *UsersStore) Get(ctx context.Context, name string) (*chronograf.User, error) {
	u, err := s.get(ctx, name)
	if err != nil {
		return nil, err
	}
	return &chronograf.User{
		Name: u.Name,
	}, nil
}

// Add a new Users in the UsersStore.
func (s *UsersStore) Add(ctx context.Context, u *chronograf.User) (*chronograf.User, error) {
	if err := s.client.db.Update(func(tx *bolt.Tx) error {
		b := tx.Bucket(UsersBucket)
		seq, err := b.NextSequence()
		if err != nil {
			return err
		}
		if v, err := internal.MarshalUser(u); err != nil {
			return err
		} else if err := b.Put(u64tob(seq), v); err != nil {
			return err
		}
		return nil
	}); err != nil {
		return nil, err
	}

	return u, nil
}

// Delete the users from the UsersStore
func (s *UsersStore) Delete(ctx context.Context, user *chronograf.User) error {
	u, err := s.get(ctx, user.Name)
	if err != nil {
		return err
	}
	if err := s.client.db.Update(func(tx *bolt.Tx) error {
		if err := tx.Bucket(UsersBucket).Delete(u64tob(u.ID)); err != nil {
			return err
		}
		return nil
	}); err != nil {
		return err
	}

	return nil
}

// Update a user
func (s *UsersStore) Update(ctx context.Context, usr *chronograf.User) error {
	u, err := s.get(ctx, usr.Name)
	if err != nil {
		return err
	}
	if err := s.client.db.Update(func(tx *bolt.Tx) error {
		u.Name = usr.Name
		if v, err := internal.MarshalUserPB(u); err != nil {
			return err
		} else if err := tx.Bucket(UsersBucket).Put(u64tob(u.ID), v); err != nil {
			return err
		}
		return nil
	}); err != nil {
		return err
	}

	return nil
}

// All returns all users
func (s *UsersStore) All(ctx context.Context) ([]chronograf.User, error) {
	var users []chronograf.User
	if err := s.client.db.View(func(tx *bolt.Tx) error {
		if err := tx.Bucket(UsersBucket).ForEach(func(k, v []byte) error {
			var user chronograf.User
			if err := internal.UnmarshalUser(v, &user); err != nil {
				return err
			}
			users = append(users, user)
			return nil
		}); err != nil {
			return err
		}
		return nil
	}); err != nil {
		return nil, err
	}

	return users, nil
}
