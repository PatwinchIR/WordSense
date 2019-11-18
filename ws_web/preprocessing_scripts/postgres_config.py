class Authenticator(object):
    def __init__(self, host):
        if host == 'WordSense':
            self.connectionString = "postgres://postgres:tirwez-vocxy6-ramXub@wordsense.ckxr3xnwwjt8.us-west-1.rds.amazonaws.com:5432/wordsense"
