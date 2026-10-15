# CI stack: Jenkins + SonarQube (plain Docker, no compose)

Two containers on one Docker network. Everything below is run from this `ci/` folder.

## 1. Network (so Jenkins can reach SonarQube by name)

```bash
docker network create wq-ci-net
```

## 2. SonarQube (official LTS Community image)

```bash
docker run -d --name sonarqube --network wq-ci-net -p 9000:9000 \
  -e SONAR_SEARCH_JAVAADDITIONALOPTS="-Dnode.store.allow_mmap=false" \
  -e SONAR_VALIDATEWEBHOOKS=false \
  -v sonarqube_data:/opt/sonarqube/data \
  sonarqube:lts-community
```

The two `-e` options are for a local Docker Desktop lab: the first lets the search engine start without
a kernel setting, the second lets SonarQube send its result to Jenkins on a private address.

Open http://localhost:9000, log in `admin` / `admin`, set a new password, then:
- **My Account > Security > Generate Token** (type: *Global Analysis Token*). Copy it.
- **Administration > Configuration > Webhooks > Create**: name `jenkins`,
  URL `http://jenkins:8080/sonarqube-webhook/`.

## 3. Jenkins (our own image built from `Dockerfile`)

```bash
docker build -t jenkins-docker:lts .

mkdir -p ~/jenkins_home
docker run -d --name jenkins --user root --network wq-ci-net \
  -p 8090:8080 -p 50000:50000 \
  -e JENKINS_HOME=$HOME/jenkins_home \
  -v $HOME/jenkins_home:$HOME/jenkins_home \
  -v /var/run/docker.sock:/var/run/docker.sock \
  jenkins-docker:lts
```

- `--user root` + the `docker.sock` mount let Jenkins run `docker` commands on your machine's Docker.
- The jenkins_home folder is mounted at the **same path** inside and outside the container, so the
  pipeline can mount its workspace into scanner containers.

Get the first-login password and open http://localhost:8090:

```bash
docker exec jenkins cat $HOME/jenkins_home/secrets/initialAdminPassword
```

Choose *Select plugins to install > None* (the needed plugins are already in the image),
then create the admin user.

## 4. Configure Jenkins (browser)

**Manage Jenkins > Credentials > System > Global > Add Credentials** (Kind: *Secret text*):

| ID | Secret |
|---|---|
| `sonar-token` | the SonarQube token from step 2 |
| `aws-access-key-id` | AWS access key ID |
| `aws-secret-access-key` | AWS secret access key |

**Manage Jenkins > System > SonarQube servers > Add**: name `sonarqube`,
URL `http://sonarqube:9000`, token credential `sonar-token`.

**New Item > Pipeline** named `water-quality-monitor`:
- Definition: *Pipeline script from SCM*, SCM: *Git*
- Repository URL: `https://github.com/jaimilshah/water-quality-devsecops.git`
- Branch: `*/main`, Script Path: `Jenkinsfile`

Click **Build with Parameters**.

## Start / stop later

```bash
docker start sonarqube jenkins      # after a restart
docker stop jenkins sonarqube
```
