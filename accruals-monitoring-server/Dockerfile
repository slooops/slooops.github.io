FROM openjdk:11

ENV APP_HOME /server

USER root
EXPOSE 8080

RUN mkdir $APP_HOME
RUN adduser --system --group rev

COPY package/repo $APP_HOME

RUN chown -R rev:rev $APP_HOME
RUN chmod -R 777 $APP_HOME

WORKDIR $APP_HOME
ENTRYPOINT [ "java" , "-jar" , "accruals-monitoring-server.jar", "&" ]


