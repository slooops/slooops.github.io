package com.cisco.des.o2c.rev.revenuemonitoringserver.queue;

public interface MessagePublisher {
	void publish(final String message);
}
