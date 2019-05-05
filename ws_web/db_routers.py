class DatabaseRouter:
    """
        A router to control all database operations on models.
    """

    def db_for_read(self, model, **hints):
        """
        Attempts to read childesdb/custom models.
        """
        if model._meta.app_label == 'childesdb':
            return 'childesdb'
        return 'default'

    def db_for_write(self, model, **hints):
        """
        Attempts to write custom models.
        """
        return 'default'

    def allow_relation(self, obj1, obj2, **hints):
        """
        Allow relations if a model in the ws app is involved.
        """
        if obj1._meta.app_label == 'ws_web' or \
                obj2._meta.app_label == 'ws_web':
            return True
        return None

    def allow_migrate(self, db, app_label, model_name=None, **hints):
        """
        Make sure the auth app only appears in the 'auth_db'
        database.
        """
        if app_label == 'ws_web':
            return db == 'default'
        return None
